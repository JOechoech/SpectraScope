/**
 * PortfolioView - My Portfolio with holdings management
 *
 * Features:
 * - Total portfolio value
 * - Today's change & total P/L
 * - Allocation breakdown
 * - Edit shares & cost basis
 * - Delete holdings
 */

import { useState, useMemo, memo, useEffect, useCallback } from 'react';
import { Edit2, Trash2, PieChart, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Header } from '@/components/layout';
import { PortfolioAnalysis } from '@/components/portfolio/PortfolioAnalysis';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { useQuoteCacheStore } from '@/stores/useQuoteCacheStore';
import * as marketData from '@/services/marketData';

interface PortfolioViewProps {
  onBack: () => void;
  onSelectStock: (symbol: string) => void;
}

const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc.',
  NVDA: 'NVIDIA Corporation',
  TSLA: 'Tesla, Inc.',
  AMZN: 'Amazon.com, Inc.',
  META: 'Meta Platforms, Inc.',
  NFLX: 'Netflix, Inc.',
  AMD: 'Advanced Micro Devices',
  INTC: 'Intel Corporation',
  JPM: 'JPMorgan Chase & Co.',
  V: 'Visa Inc.',
};

export const PortfolioView = memo(function PortfolioView({
  onBack,
  onSelectStock,
}: PortfolioViewProps) {
  const { items: watchlistItems, holdings, setShares } = useWatchlistStore();
  const quotes = useQuoteCacheStore((s) => s.quotes);
  const setQuotesCache = useQuoteCacheStore((s) => s.setQuotes);

  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editShares, setEditShares] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get all holdings symbols (UPPERCASE)
  const holdingsSymbols = useMemo(() => {
    return Object.values(holdings)
      .filter((h) => h.shares > 0)
      .map((h) => h.symbol.toUpperCase());
  }, [holdings]);

  // Fetch quotes for all holdings
  const loadQuotes = useCallback(async () => {
    if (holdingsSymbols.length === 0) return;

    setIsLoading(true);
    console.log('[PortfolioView] Fetching quotes for holdings:', holdingsSymbols);

    try {
      const result = await marketData.getBulkQuotes(holdingsSymbols);
      console.log('[PortfolioView] Quotes received:', Object.fromEntries(result.quotes));

      // Update global cache
      if (result.source !== 'unavailable') {
        setQuotesCache(result.quotes, result.source);
      }
    } catch (error) {
      console.error('[PortfolioView] Failed to load quotes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [holdingsSymbols, setQuotesCache]);

  // Load quotes on mount and when holdings change
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Calculate portfolio metrics - READ DIRECTLY FROM HOLDINGS!
  const portfolio = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    const positions: Array<{
      symbol: string;
      name: string;
      shares: number;
      price: number;
      value: number;
      change: number;
      changePercent: number;
      weight: number;
      costBasis?: number;
      profitLoss?: number;
      profitLossPercent?: number;
    }> = [];

    // FIX: Iterate directly over holdings, NOT watchlistItems!
    // This ensures stocks like AMD show up even if not in default watchlist
    Object.values(holdings).forEach((holding) => {
      if (holding.shares <= 0) return; // Skip zero shares

      const symbol = holding.symbol.toUpperCase();
      const quote = quotes[symbol];

      // Find name from watchlist or use lookup table
      const watchlistItem = watchlistItems.find((w) => w.symbol === symbol);
      const name = watchlistItem?.name || COMPANY_NAMES[symbol] || symbol;

      // Calculate values - use 0 if no quote available
      const price = quote?.price || 0;
      const value = holding.shares * price;
      totalValue += value;

      if (holding.avgCost) {
        totalCost += holding.shares * holding.avgCost;
      }

      positions.push({
        symbol,
        name,
        shares: holding.shares,
        price,
        value,
        change: quote?.change || 0,
        changePercent: quote?.changePercent || 0,
        weight: 0, // Calculate after
        costBasis: holding.avgCost,
        profitLoss: holding.avgCost
          ? value - holding.shares * holding.avgCost
          : undefined,
        profitLossPercent: holding.avgCost && price > 0
          ? ((price - holding.avgCost) / holding.avgCost) * 100
          : undefined,
      });
    });

    // Calculate weights
    positions.forEach((p) => {
      p.weight = totalValue > 0 ? (p.value / totalValue) * 100 : 0;
    });

    // Sort by value
    positions.sort((a, b) => b.value - a.value);

    const totalProfitLoss = totalCost > 0 ? totalValue - totalCost : 0;
    const totalProfitLossPercent =
      totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    // Today's change
    const todayChange = positions.reduce(
      (sum, p) => sum + p.shares * p.change,
      0
    );
    const todayChangePercent =
      totalValue > 0 ? (todayChange / (totalValue - todayChange)) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalProfitLoss,
      totalProfitLossPercent,
      todayChange,
      todayChangePercent,
      positions,
    };
  }, [watchlistItems, holdings, quotes]);

  const handleSaveShares = (symbol: string) => {
    const shares = parseFloat(editShares);
    if (!isNaN(shares) && shares >= 0) {
      setShares(symbol, shares);
    }
    setEditingSymbol(null);
    setEditShares('');
  };

  const handleRemove = (symbol: string) => {
    setShares(symbol, 0); // Clear shares first
    setEditingSymbol(null);
  };

  // Color palette for allocation chart
  const COLORS = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <Header
        title="My Portfolio"
        subtitle={`${portfolio.positions.length} holdings`}
        showBack
        onBack={onBack}
        rightContent={
          <button
            onClick={loadQuotes}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Portfolio Summary */}
      <div className="p-5 bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="text-center mb-4">
          <p className="text-slate-400 text-sm mb-1">Total Value</p>
          <p className="text-4xl font-bold text-white">
            $
            {portfolio.totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Today's Change & Total P/L */}
        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <p className="text-slate-400 text-xs mb-1">Today</p>
            <p
              className={`font-semibold ${
                portfolio.todayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {portfolio.todayChange >= 0 ? '+' : ''}$
              {portfolio.todayChange.toFixed(2)}
              <span className="text-sm ml-1">
                ({portfolio.todayChange >= 0 ? '+' : ''}
                {portfolio.todayChangePercent.toFixed(2)}%)
              </span>
            </p>
          </div>

          {portfolio.totalCost > 0 && (
            <div className="text-center">
              <p className="text-slate-400 text-xs mb-1">Total P/L</p>
              <p
                className={`font-semibold ${
                  portfolio.totalProfitLoss >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {portfolio.totalProfitLoss >= 0 ? '+' : ''}$
                {portfolio.totalProfitLoss.toFixed(2)}
                <span className="text-sm ml-1">
                  ({portfolio.totalProfitLoss >= 0 ? '+' : ''}
                  {portfolio.totalProfitLossPercent.toFixed(2)}%)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Allocation Bar */}
        {portfolio.positions.length > 0 && (
          <div className="h-3 rounded-full overflow-hidden flex bg-slate-800">
            {portfolio.positions.map((pos, i) => (
              <div
                key={pos.symbol}
                className={`h-full ${COLORS[i % COLORS.length]}`}
                style={{ width: `${pos.weight}%` }}
                title={`${pos.symbol}: ${pos.weight.toFixed(1)}%`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Portfolio Analysis */}
      {portfolio.positions.length > 0 && (
        <div className="px-5 py-4">
          <PortfolioAnalysis
            positions={portfolio.positions}
            totalValue={portfolio.totalValue}
          />
        </div>
      )}

      {/* Holdings List */}
      <div className="px-5 py-4 space-y-3">
        <h2 className="text-slate-400 text-sm font-medium">Holdings</h2>

        {portfolio.positions.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-6 text-center">
            <PieChart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No holdings with shares</p>
            <p className="text-slate-500 text-sm mt-1">
              Tap a stock and add shares to track
            </p>
          </div>
        ) : (
          portfolio.positions.map((pos, index) => (
            <div
              key={pos.symbol}
              className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden"
            >
              {editingSymbol === pos.symbol ? (
                /* Edit Mode */
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          COLORS[index % COLORS.length]
                        }`}
                      />
                      <span className="text-white font-semibold">
                        {pos.symbol}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemove(pos.symbol)}
                      className="text-rose-400 text-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editShares}
                      onChange={(e) => setEditShares(e.target.value)}
                      placeholder="Number of shares"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveShares(pos.symbol)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSymbol(null)}
                      className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div
                  onClick={() => onSelectStock(pos.symbol)}
                  className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            COLORS[index % COLORS.length]
                          }`}
                        />
                        <span className="text-white font-semibold">
                          {pos.symbol}
                        </span>
                        <span className="text-xs text-slate-500">
                          {pos.shares} shares
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-0.5">{pos.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        $
                        {pos.value.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p
                        className={`text-sm ${
                          pos.changePercent >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {pos.changePercent >= 0 ? (
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 inline mr-1" />
                        )}
                        {pos.changePercent >= 0 ? '+' : ''}
                        {pos.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Weight & P/L */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">
                        {pos.weight.toFixed(1)}% of portfolio
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSymbol(pos.symbol);
                          setEditShares(pos.shares.toString());
                        }}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    {pos.profitLoss !== undefined && (
                      <span
                        className={`text-sm ${
                          pos.profitLoss >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        P/L: {pos.profitLoss >= 0 ? '+' : ''}$
                        {pos.profitLoss.toFixed(0)} (
                        {pos.profitLossPercent?.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default PortfolioView;
