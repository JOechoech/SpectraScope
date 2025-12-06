/**
 * HomeView - Market Overview with Indices, Portfolio, and Watchlist
 *
 * Features:
 * - Market indices via ETFs with sparklines
 * - Portfolio value with individual holdings
 * - Watchlist with signals, sparklines, and glow effects
 * - Compact design
 */

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { RefreshCw, Settings, Minus } from 'lucide-react';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { useQuoteCacheStore } from '@/stores/useQuoteCacheStore';
import { useAnalysisStore } from '@/stores/useAnalysisStore';
import * as marketData from '@/services/marketData';
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateBollingerBands,
} from '@/utils/technicals';
import {
  getRSISignal,
  getMACDSignal,
  getSMASignal,
  getBollingerSignal,
  calculateAggregateScore,
} from '@/utils/signals';
import type { StockQuote } from '@/types';
import type { AggregateScore } from '@/utils/signals';

// Market Indices (ETFs that Polygon supports)
const MARKET_INDICES = [
  { symbol: 'SPY', name: 'S&P 500', icon: '\u{1F1FA}\u{1F1F8}' },  // 🇺🇸
  { symbol: 'QQQ', name: 'NASDAQ', icon: '\u{1F4C8}' },           // 📈
  { symbol: 'DIA', name: 'Dow Jones', icon: '\u{1F3DB}\u{FE0F}' }, // 🏛️
  { symbol: 'VGK', name: 'Europe', icon: '\u{1F1EA}\u{1F1FA}' },   // 🇪🇺
  { symbol: 'GLD', name: 'Gold', icon: '\u{1F947}' },              // 🥇
  { symbol: 'USO', name: 'Oil', icon: '\u{1F6E2}\u{FE0F}' },       // 🛢️
];

// Default watchlist stocks (Magnificent 7)
const DEFAULT_WATCHLIST = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'TSLA', name: 'Tesla' },
];

// LocalStorage key for hidden default stocks
const HIDDEN_DEFAULTS_KEY = 'spectrascope_hidden_defaults';

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

// Sector emoji mapping
const SECTOR_EMOJIS: Record<string, string> = {
  tech: '💻',
  biotech: '🧬',
  finance: '🏦',
  energy: '⚡',
  healthcare: '🏥',
  retail: '🛒',
  gaming: '🎮',
  meme: '🚀',
};

// Format date as DD.MM.YYYY
function formatScopedDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Format time ago for analysis date
function formatAnalysisAge(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

/**
 * Format price with appropriate decimal places
 * - Under $1: 3 decimals ($0.823)
 * - $1+: 2 decimals ($278.78)
 */
function formatPrice(price: number): string {
  if (price < 1) {
    return price.toFixed(3);
  }
  return price.toFixed(2);
}

/**
 * Mini Sparkline SVG component
 */
function MiniSparkline({
  data,
  width = 48,
  height = 20,
  isUp = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  isUp?: boolean;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const color = isUp ? '#10b981' : '#f43f5e';

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface StockData {
  sparkline: number[];
  signalScore?: AggregateScore;
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
  const { items: watchlistItems, removeStock, updateStock, holdings } = useWatchlistStore();
  const cachedQuotes = useQuoteCacheStore((s) => s.quotes);
  const cachedDataSource = useQuoteCacheStore((s) => s.dataSource);
  const setQuotesCache = useQuoteCacheStore((s) => s.setQuotes);
  const { getLatestAnalysis } = useAnalysisStore();

  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Hidden default stocks (Mag7 that user removed)
  const [hiddenDefaults, setHiddenDefaults] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(HIDDEN_DEFAULTS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const polygonKey = getApiKey('polygon');

  // Hide a default stock
  const hideDefaultStock = useCallback((symbol: string) => {
    setHiddenDefaults(prev => {
      const next = new Set(prev);
      next.add(symbol);
      localStorage.setItem(HIDDEN_DEFAULTS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Default watchlist symbols (excluding hidden ones)
  const defaultWatchlistSymbols = useMemo(
    () => new Set(DEFAULT_WATCHLIST.map((s) => s.symbol)),
    []
  );

  // Visible default stocks (filter out hidden)
  const visibleDefaultStocks = useMemo(
    () => DEFAULT_WATCHLIST.filter(s => !hiddenDefaults.has(s.symbol)),
    [hiddenDefaults]
  );

  // Combined watchlist: visible defaults + user-added stocks from search
  const combinedWatchlist = useMemo(() => {
    const result = [...visibleDefaultStocks];
    const indicesSymbols = new Set(MARKET_INDICES.map((i) => i.symbol));
    watchlistItems.forEach((item) => {
      if (!defaultWatchlistSymbols.has(item.symbol) && !indicesSymbols.has(item.symbol)) {
        result.push({ symbol: item.symbol, name: item.name || COMPANY_NAMES[item.symbol] || item.symbol });
      }
    });
    return result;
  }, [watchlistItems, defaultWatchlistSymbols, visibleDefaultStocks]);

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

  // Load quotes and daily data for sparklines/signals
  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      // Fetch quotes
      const result = await marketData.getBulkQuotes(allSymbols);
      setQuotes(result.quotes);
      setLastUpdate(new Date());

      if (result.source !== 'unavailable') {
        setQuotesCache(result.quotes, result.source);
      }

      // Fetch daily data for each symbol (for sparklines and signals)
      const newStockData: Record<string, StockData> = {};

      await Promise.all(
        allSymbols.map(async (symbol) => {
          try {
            const dailyResult = await marketData.getDailyData(symbol, 30);
            const prices = (dailyResult.data || []).slice(0, 20).map((d) => d.close).reverse();

            let signalScore: AggregateScore | undefined;
            const quote = result.quotes.get(symbol);

            // Calculate signals if we have enough data
            if (prices.length >= 20 && quote) {
              try {
                const rsi = calculateRSI(prices);
                const macd = calculateMACD(prices);
                const sma20 = calculateSMA(prices, 20);
                const sma50 = prices.length >= 50 ? calculateSMA(prices, 50) : sma20;
                const bollinger = calculateBollingerBands(prices);

                const signals = [
                  getRSISignal(rsi),
                  getMACDSignal(macd.histogram, macd.histogram - macd.signal),
                  getSMASignal(quote.price, sma20, 20),
                  getSMASignal(quote.price, sma50, 50),
                  getBollingerSignal(quote.price, bollinger.upper, bollinger.middle, bollinger.lower),
                ];

                signalScore = calculateAggregateScore(signals);
              } catch (e) {
                console.warn(`Signal calc error for ${symbol}:`, e);
              }
            }

            newStockData[symbol] = { sparkline: prices, signalScore };
          } catch (e) {
            newStockData[symbol] = { sparkline: [] };
          }
        })
      );

      setStockData(newStockData);
    } catch (err) {
      console.error('[HomeView] Failed to load:', err);
    } finally {
      setIsLoading(false);
    }
  }, [allSymbols, setQuotesCache]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Use cached quotes on mount
  useEffect(() => {
    if (Object.keys(cachedQuotes).length > 0) {
      const map = new Map<string, StockQuote>();
      Object.entries(cachedQuotes).forEach(([symbol, quote]) => {
        map.set(symbol, quote);
      });
      setQuotes(map);
    }
  }, [cachedQuotes]);

  // Portfolio calculations
  const totalValue = useMemo(
    () =>
      holdingsWithShares.reduce((sum, h) => {
        const quote = quotes.get(h.symbol.toUpperCase());
        return sum + h.shares * (quote?.price || 0);
      }, 0),
    [holdingsWithShares, quotes]
  );

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

  // Update scopedPrice for newly scoped stocks when quote first loads
  useEffect(() => {
    watchlistItems.forEach((item) => {
      // If stock was scoped but scopedPrice is 0 or undefined, update it
      if (item.scopedFrom && (!item.scopedPrice || item.scopedPrice === 0)) {
        const quote = quotes.get(item.symbol);
        if (quote && quote.price > 0) {
          updateStock(item.symbol, { scopedPrice: quote.price });
        }
      }
    });
  }, [watchlistItems, quotes, updateStock]);

  const formatTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  // Calculate performance since scope
  const getScopePerformance = (scopedPrice: number, currentPrice: number) => {
    if (!scopedPrice || scopedPrice === 0) return null;
    const change = currentPrice - scopedPrice;
    const percentChange = ((change / scopedPrice) * 100);
    return { change, percentChange };
  };

  return (
    <div className="flex flex-col h-full bg-inherit min-h-screen">
      {/* Header */}
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

      {/* Data Source */}
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
        {/* 1. Market Overview */}
        <div className="px-4 mb-4">
          <h2 className="text-white font-semibold text-sm mb-2">Market Overview</h2>
          <div className="grid grid-cols-3 gap-1.5">
            {MARKET_INDICES.map((index) => {
              const quote = quotes.get(index.symbol);
              const data = stockData[index.symbol];
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
                      <div className="flex items-center justify-between">
                        <p className="text-white font-semibold text-sm">${formatPrice(quote.price)}</p>
                        {data?.sparkline && data.sparkline.length > 1 && (
                          <MiniSparkline data={data.sparkline} width={32} height={14} isUp={isUp} />
                        )}
                      </div>
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
                const data = stockData[symbol];
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
                      <span className="text-white font-medium text-sm w-12">{symbol}</span>
                      <span className="text-slate-500 text-xs">{holding.shares}</span>
                      {data?.sparkline && data.sparkline.length > 1 && (
                        <MiniSparkline data={data.sparkline} width={40} height={16} isUp={isUp} />
                      )}
                    </div>

                    {quote ? (
                      <div className="text-right">
                        <span className="text-white text-sm block">${formatPrice(value)}</span>
                        <span className={`text-[10px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)}
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
        )}

        {/* 3. Watchlist */}
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
          <div className="space-y-1.5">
            {combinedWatchlist.map((stock) => {
              const quote = quotes.get(stock.symbol);
              const data = stockData[stock.symbol];
              const isUp = (quote?.change ?? 0) >= 0;
              const holding = holdings[stock.symbol];
              const isUserAdded = !defaultWatchlistSymbols.has(stock.symbol);

              // Get scoped info from watchlist store
              const watchlistItem = watchlistItems.find(item => item.symbol === stock.symbol);
              const scopedInfo = watchlistItem?.scopedFrom ? {
                from: watchlistItem.scopedFrom,
                at: watchlistItem.scopedAt,
                price: watchlistItem.scopedPrice,
                sentiment: watchlistItem.scopedSentiment,
                source: watchlistItem.scopedSource,
              } : null;

              const scopePerf = scopedInfo?.price && quote?.price
                ? getScopePerformance(scopedInfo.price, quote.price)
                : null;

              // Get latest analysis for this stock
              const latestAnalysis = getLatestAnalysis(stock.symbol);
              const analysisAge = latestAnalysis ? formatAnalysisAge(latestAnalysis.timestamp) : null;

              return (
                <div
                  key={stock.symbol}
                  className="flex flex-col px-3 py-2 bg-slate-800/30 border border-slate-700/50 rounded-xl"
                >
                  <div className="flex items-center">
                    {/* Remove Button - works for all stocks in edit mode */}
                    {isEditMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isUserAdded) {
                            removeStock(stock.symbol);
                          } else {
                            hideDefaultStock(stock.symbol);
                          }
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
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{stock.symbol}</span>
                            {holding?.shares > 0 && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                {holding.shares}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-xs">{stock.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Sparkline */}
                        {data?.sparkline && data.sparkline.length > 1 && (
                          <MiniSparkline data={data.sparkline} width={48} height={20} isUp={isUp} />
                        )}

                        {/* Price & Change */}
                        {quote ? (
                          <div className="text-right min-w-[70px]">
                            <span className="text-white text-sm block">${formatPrice(quote.price)}</span>
                            <span className={`text-[10px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">--</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scoped Tag - Show if stock was added via Scope */}
                  {scopedInfo && (
                    <div
                      className="mt-1.5 pt-1.5 border-t border-slate-700/30 cursor-pointer"
                      onClick={() => onSelectStock(stock.symbol)}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span>🏷️</span>
                          <span>Scoped {scopedInfo.at ? formatScopedDate(scopedInfo.at) : ''}</span>
                          <span>•</span>
                          <span className={
                            scopedInfo.sentiment === 'bullish' ? 'text-emerald-400' :
                            scopedInfo.sentiment === 'bearish' ? 'text-rose-400' : 'text-slate-400'
                          }>
                            {scopedInfo.sentiment ? scopedInfo.sentiment.charAt(0).toUpperCase() + scopedInfo.sentiment.slice(1) : 'Neutral'}
                          </span>
                          <span>{SECTOR_EMOJIS[scopedInfo.from] || '📊'}</span>
                        </div>
                        {scopePerf && (
                          <span className={scopePerf.percentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {scopePerf.percentChange >= 0 ? '📈' : '📉'} {scopePerf.percentChange >= 0 ? '+' : ''}{scopePerf.percentChange.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Last Analysis - Show analysis status */}
                  {(analysisAge || !scopedInfo) && (
                    <div
                      className={`${scopedInfo ? '' : 'mt-1.5 pt-1.5 border-t border-slate-700/30'} cursor-pointer`}
                      onClick={() => onSelectStock(stock.symbol)}
                    >
                      <div className="flex items-center text-[10px]">
                        {analysisAge ? (
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span>📊</span>
                            <span>Analysis: {analysisAge}</span>
                            {latestAnalysis?.dominantScenario === 'bull' && <span className="text-emerald-400">• Bull</span>}
                            {latestAnalysis?.dominantScenario === 'bear' && <span className="text-rose-400">• Bear</span>}
                            {latestAnalysis?.dominantScenario === 'base' && <span className="text-blue-400">• Base</span>}
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <span>⚪</span>
                            <span>Not analyzed yet</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
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
