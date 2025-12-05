/**
 * WatchlistView - Home screen showing tracked stocks
 *
 * Features:
 * - Displays watchlist with real-time data when API key available
 * - Falls back to mock data without API key
 * - Signal score calculation and glow effects
 * - Pull to refresh functionality
 */

import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Search, RefreshCw, Zap, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout';
import { StockCard } from '@/components/watchlist/StockCard';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { NewsCarousel } from '@/components/news/NewsCarousel';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { useStoreHydration } from '@/stores/useApiKeysStore';
import * as marketData from '@/services/marketData';
import { getMockDailyData } from '@/services/api/polygon';
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
} from '@/utils/technicals';
import {
  getRSISignal,
  getMACDSignal,
  getSMASignal,
  calculateAggregateScore,
} from '@/utils/signals';
import type { StockQuote } from '@/types';
import type { AggregateScore } from '@/utils/signals';
import type { DataSource } from '@/services/marketData';

interface WatchlistViewProps {
  onSelectStock: (symbol: string) => void;
  onOpenSettings: () => void;
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
}: WatchlistViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource | null>(null); // null until loaded
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Wait for store hydration before accessing API keys
  const isHydrated = useStoreHydration();

  const { items: watchlistItems, updateStock } = useWatchlistStore();

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

  // Load stock data using unified market data service (bulk when available)
  const loadStockData = useCallback(async () => {
    if (symbols.length === 0) return;

    setIsRefreshing(true);

    try {
      // Use bulk loading - automatically uses Polygon if available, else Alpha Vantage
      const { quotes, source, errors } = await marketData.getBulkQuotes(symbols);
      setDataSource(source);

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
          prices = dailyResult.data.slice(0, 20).map((d) => d.close);
        } catch {
          const mockDaily = getMockDailyData(symbol, 30);
          prices = mockDaily.slice(-20).map((d) => d.close);
        }

        // Calculate signal score if we have enough data
        let signalScore: AggregateScore | undefined;
        if (prices.length >= 14) {
          try {
            const rsi = calculateRSI(prices);
            const macd = calculateMACD(prices);
            const sma20 = prices.length >= 20 ? calculateSMA(prices, 20) : prices[0];

            const signals = [
              getRSISignal(rsi),
              getMACDSignal(macd.histogram, macd.histogram - macd.signal),
              getSMASignal(quote.price, sma20, 20),
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
    setInitialLoadDone(true);
  }, [symbols, updateStock]);

  // Initial load - wait for hydration before loading
  useEffect(() => {
    if (!isHydrated) return; // Wait for store to hydrate
    if (symbols.length > 0) {
      loadStockData();
    } else {
      // No symbols but hydrated - show proper source anyway
      setDataSource(marketData.getCurrentProvider());
      setInitialLoadDone(true);
    }
  }, [isHydrated, symbols.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
          onClick={loadStockData}
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

      {/* Data Source Indicator */}
      <div className="mx-5 mb-3">
        {!isHydrated || !initialLoadDone ? (
          <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <Loader2 size={16} className="text-slate-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading...</p>
          </div>
        ) : dataSource === 'polygon' ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <Zap size={16} className="text-emerald-400" />
            <p className="text-emerald-400 text-sm">
              Real-time via Polygon.io
            </p>
          </div>
        ) : dataSource === 'alphavantage' ? (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <Clock size={16} className="text-amber-400" />
            <p className="text-amber-400 text-sm">
              Delayed quotes via Alpha Vantage (rate limited)
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-slate-500/10 border border-slate-500/30 rounded-xl">
            <AlertCircle size={16} className="text-slate-400" />
            <p className="text-slate-400 text-sm">
              Demo mode (no API key). Add API key in Settings for real data.
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

          return (
            <StockCard
              key={symbol}
              symbol={symbol}
              name={watchlistItem?.name || symbol}
              price={data.quote.price}
              change={data.quote.change}
              changePercent={data.quote.changePercent}
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
