/**
 * WatchlistView - Home screen showing tracked stocks
 *
 * Features:
 * - Displays watchlist with real-time data when API key available
 * - Falls back to mock data without API key
 * - Signal score calculation and glow effects
 * - Pull to refresh functionality
 */

import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { Search, RefreshCw, Zap, AlertCircle, Loader2, Briefcase, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout';
import { StockCard } from '@/components/watchlist/StockCard';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { NewsCarousel } from '@/components/news/NewsCarousel';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { useStoreHydration } from '@/stores/useApiKeysStore';
import { useQuoteCacheStore } from '@/stores/useQuoteCacheStore';
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

interface WatchlistViewProps {
  onSelectStock: (symbol: string) => void;
  onOpenSettings: () => void;
  onOpenPortfolio?: () => void;
}

interface StockData {
  quote: StockQuote;
  sparkline: number[];
  signalScore?: AggregateScore;
  loading: boolean;
  error?: string;
}

/**
 * WatchlistView - Home screen showing tracked stocks
 */
export const WatchlistView = memo(function WatchlistView({
  onSelectStock,
  onOpenSettings,
  onOpenPortfolio,
}: WatchlistViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackgroundRefresh, setIsBackgroundRefresh] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const hasFetchedRef = useRef(false);

  // Wait for store hydration before accessing API keys
  const isHydrated = useStoreHydration();

  // Use global quote cache
  const cachedQuotes = useQuoteCacheStore((s) => s.quotes);
  const cachedDataSource = useQuoteCacheStore((s) => s.dataSource);
  const lastFetch = useQuoteCacheStore((s) => s.lastFetch);
  const isStale = useQuoteCacheStore((s) => s.isStale);
  const setQuotesCache = useQuoteCacheStore((s) => s.setQuotes);

  const { items: watchlistItems, updateStock, holdings } = useWatchlistStore();

  // Get symbols from watchlist
  const symbols = useMemo(
    () => watchlistItems.map((item) => item.symbol),
    [watchlistItems]
  );

  // Filter stocks based on search
  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) return symbols;
    const query = searchQuery.toLowerCase();
    return symbols.filter((symbol) => {
      const item = watchlistItems.find((w) => w.symbol === symbol);
      return (
        symbol.toLowerCase().includes(query) ||
        item?.name?.toLowerCase().includes(query)
      );
    });
  }, [symbols, searchQuery, watchlistItems]);

  // Check if we have holdings
  const hasHoldings = useMemo(() => {
    return Object.values(holdings).some((h) => h.shares > 0);
  }, [holdings]);

  // Load stock data using unified market data service (bulk when available)
  const loadStockData = useCallback(async (background = false) => {
    if (symbols.length === 0) return;

    if (background) {
      setIsBackgroundRefresh(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      // Use bulk loading - automatically uses Polygon if available, else Alpha Vantage
      const { quotes, source, errors } = await marketData.getBulkQuotes(symbols);

      // Store in global cache
      setQuotesCache(quotes, source);

      if (errors.length > 0) {
        console.warn('Some quotes failed:', errors);
      }

      // Process each quote
      for (const symbol of symbols) {
        const quote = quotes.get(symbol);

        if (!quote) {
          setStockData((prev) => ({
            ...prev,
            [symbol]: {
              ...prev[symbol],
              loading: false,
              error: 'No data',
            },
          }));
          continue;
        }

        // Get sparkline data (use mock for simplicity, real daily data can be slow)
        let prices: number[] = [];
        try {
          const dailyResult = await marketData.getDailyData(symbol, 30);
          prices = (dailyResult.data || []).slice(0, 20).map((d) => d.close);
        } catch {
          // No mock fallback - use empty array if real data unavailable
          prices = [];
        }

        // Calculate signal score if we have enough data (need at least 26 for MACD)
        let signalScore: AggregateScore | undefined;
        if (prices.length >= 26) {
          try {
            const rsi = calculateRSI(prices);
            const macd = calculateMACD(prices);
            const sma20 = calculateSMA(prices, 20);
            const sma50 = prices.length >= 50 ? calculateSMA(prices, 50) : sma20;
            const bollinger = calculateBollingerBands(prices);

            // All 5 indicators: RSI, MACD, SMA20, SMA50, Bollinger
            const signals = [
              getRSISignal(rsi),
              getMACDSignal(macd.histogram, macd.histogram - macd.signal),
              getSMASignal(quote.price, sma20, 20),
              getSMASignal(quote.price, sma50, 50),
              getBollingerSignal(quote.price, bollinger.upper, bollinger.middle, bollinger.lower),
            ];

            signalScore = calculateAggregateScore(signals);
          } catch (e) {
            console.warn('Signal calculation error:', e);
          }
        }

        // Update stock data
        setStockData((prev) => ({
          ...prev,
          [symbol]: {
            quote,
            sparkline: prices,
            signalScore,
            loading: false,
          },
        }));

        // Also update the store with latest price
        updateStock(symbol, {
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          sparkline: prices,
        });
      }
    } catch (error) {
      console.error('Bulk loading failed:', error);
      // Mark all as error
      for (const symbol of symbols) {
        setStockData((prev) => ({
          ...prev,
          [symbol]: {
            ...prev[symbol],
            loading: false,
            error: 'Failed to load',
          },
        }));
      }
    }

    setIsRefreshing(false);
    setIsBackgroundRefresh(false);
    setInitialLoadDone(true);
  }, [symbols, updateStock, setQuotesCache]);

  // Initial load - check cache first, only fetch if stale or empty
  useEffect(() => {
    if (!isHydrated) return; // Wait for store to hydrate
    if (hasFetchedRef.current) return; // Already fetched this session

    const hasCache = Object.keys(cachedQuotes).length > 0;
    const stale = isStale();

    if (symbols.length > 0) {
      if (!hasCache || stale) {
        hasFetchedRef.current = true;
        loadStockData(hasCache); // Background refresh if we have cache
      } else {
        // Use cached data
        for (const symbol of symbols) {
          const quote = cachedQuotes[symbol];
          if (quote) {
            // Use sparkline from watchlist item if available
            const watchlistItem = watchlistItems.find((w) => w.symbol === symbol);
            const prices = watchlistItem?.sparkline || [];

            setStockData((prev) => ({
              ...prev,
              [symbol]: {
                quote,
                sparkline: prices,
                loading: false,
              },
            }));
          }
        }
        setInitialLoadDone(true);
      }
    } else {
      setInitialLoadDone(true);
    }
  }, [isHydrated, symbols.length, cachedQuotes, isStale]); // eslint-disable-line react-hooks/exhaustive-deps

  // Background refresh every 60 seconds if using Polygon
  useEffect(() => {
    if (cachedDataSource !== 'polygon') return;

    const interval = setInterval(() => {
      loadStockData(true); // Background refresh
    }, 60000);

    return () => clearInterval(interval);
  }, [cachedDataSource, loadStockData]);

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <Header
        title="Home"
        subtitle="Your portfolio at a glance"
        showSettings
        onSettings={onOpenSettings}
      />

      {/* News Carousel */}
      <NewsCarousel />

      {/* Search & Refresh */}
      <div className="px-5 py-3 flex gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
        </div>
        <button
          onClick={() => loadStockData()}
          disabled={isRefreshing}
          className={`p-3 rounded-xl transition-all ${
            isRefreshing
              ? 'bg-slate-800 text-slate-500'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
          }`}
        >
          <RefreshCw
            size={20}
            className={isRefreshing ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* Background Refresh Indicator */}
      {isBackgroundRefresh && (
        <div className="mx-5 mb-2">
          <div className="text-xs text-blue-400 flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            Updating prices...
          </div>
        </div>
      )}

      {/* Data Source Indicator */}
      <div className="mx-5 mb-3">
        {!isHydrated || !initialLoadDone ? (
          <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <Loader2 size={16} className="text-slate-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading...</p>
          </div>
        ) : cachedDataSource === 'polygon' ? (
          <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-emerald-400" />
              <p className="text-emerald-400 text-sm">Real-time via Polygon.io</p>
            </div>
            {lastFetch && (
              <span className="text-emerald-400/60 text-xs">
                {Math.round((Date.now() - lastFetch) / 1000)}s ago
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-slate-500/10 border border-slate-500/30 rounded-xl">
            <AlertCircle size={16} className="text-slate-400" />
            <p className="text-slate-400 text-sm">
              Demo mode - Add API key in Settings
            </p>
          </div>
        )}
      </div>

      {/* Portfolio Summary */}
      <div className="px-5 mb-3">
        <PortfolioSummary
          quotes={
            new Map(
              Object.entries(stockData)
                .filter(([, data]) => data?.quote)
                .map(([symbol, data]) => [symbol, data.quote])
            )
          }
        />
      </div>

      {/* Stock List */}
      <div className="px-5 py-2 space-y-3">
        {filteredSymbols.map((symbol) => {
          const data = stockData[symbol];
          const watchlistItem = watchlistItems.find(
            (w) => w.symbol === symbol
          );

          if (!data || data.loading) {
            return <StockCardSkeleton key={symbol} />;
          }

          // Handle missing quote data gracefully - NO crash!
          if (!data.quote) {
            return (
              <div
                key={symbol}
                onClick={() => onSelectStock(symbol)}
                className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-white font-semibold">{symbol}</span>
                    <p className="text-slate-500 text-sm">{watchlistItem?.name || symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500">Price unavailable</p>
                    <p className="text-slate-600 text-sm">Add API key</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <StockCard
              key={symbol}
              symbol={symbol}
              name={watchlistItem?.name || symbol}
              price={data.quote.price ?? 0}
              change={data.quote.change ?? 0}
              changePercent={data.quote.changePercent ?? 0}
              sparklineData={data.sparkline}
              signalScore={data.signalScore}
              onClick={() => onSelectStock(symbol)}
            />
          );
        })}

        {filteredSymbols.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No stocks found</p>
            <p className="text-slate-600 text-sm mt-1">
              Try a different search term
            </p>
          </div>
        )}

        {/* My Portfolio Button */}
        {onOpenPortfolio && symbols.length > 0 && (
          <button
            onClick={onOpenPortfolio}
            className="w-full mt-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl p-4 flex items-center gap-3 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold">My Portfolio</div>
              <div className="text-sm text-slate-400">
                {hasHoldings ? 'View holdings & performance' : 'Track your shares'}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
});

/**
 * Skeleton loading state for stock card
 */
function StockCardSkeleton() {
  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-5 bg-slate-800 rounded w-16 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-24" />
        </div>
        <div className="text-right">
          <div className="h-5 bg-slate-800 rounded w-20 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-16" />
        </div>
      </div>
      <div className="h-8 bg-slate-800 rounded w-full" />
    </div>
  );
}

export default WatchlistView;
