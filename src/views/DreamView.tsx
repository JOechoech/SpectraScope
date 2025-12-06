/**
 * DreamView - "What if...?" scenarios
 *
 * Features:
 * - Backtest: What if I had bought...
 * - Forecast: What if price reaches...
 * - Moon Mode: All bull cases - When Lambo?
 * - Doom Mode: All bear cases - Maximum Pain
 */

import { useState, useEffect, useCallback, memo } from 'react';
import {
  Moon,
  Rewind,
  Target,
  Rocket,
  Skull,
  Search,
  Calendar,
  DollarSign,
  Sparkles,
  Cloud,
  Star,
  ChevronRight,
  Clock,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { useAnalysisStore } from '@/stores/useAnalysisStore';
import * as marketData from '@/services/marketData';

// Dream types
type DreamMode = 'menu' | 'backtest' | 'forecast' | 'moon' | 'doom';

interface BacktestResult {
  symbol: string;
  investmentDate: string;
  investmentAmount: number;
  purchasePrice: number;
  currentPrice: number;
  sharesOwned: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
  spComparison: number;
  cashComparison: number;
}

interface ForecastResult {
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  changeNeeded: number;
  currentShares: number;
  currentValue: number;
  targetValue: number;
  potentialProfit: number;
}

interface PortfolioProjection {
  symbol: string;
  shares: number;
  currentPrice: number;
  targetPrice: number;
  currentValue: number;
  targetValue: number;
  change: number;
  changePercent: number;
}

interface SavedDream {
  id: string;
  type: DreamMode;
  timestamp: string;
  title: string;
  summary: string;
  data: BacktestResult | ForecastResult | PortfolioProjection[];
}

// Status messages for each mode
const STATUS_MESSAGES = {
  backtest: [
    'DRIFTING INTO THE CLOUDS...',
    'CONSULTING THE CRYSTAL BALL...',
    'TRAVELING THROUGH TIME...',
    'ASKING THE MOON...',
  ],
  forecast: [
    'CONSULTING THE CRYSTAL BALL...',
    'ASKING THE MOON...',
    'READING THE STARS...',
    'CHANNELING THE ORACLE...',
  ],
  moon: [
    'STRAPPING INTO THE ROCKET...',
    'DESTINATION: MOON',
    'CALCULATING TENDIES...',
    'WHEN LAMBO? SOON...',
    'DIAMOND HANDS ACTIVATED...',
    'CHECKING SQUEEZE STATUS...',
    'TO THE MOON!',
  ],
  doom: [
    'ENTERING THE VOID...',
    'CONSULTING THE BEARS...',
    'CALCULATING MAXIMUM PAIN...',
    'PAPER HANDS DETECTED...',
    'F IN CHAT...',
    'HEDGING THE APOCALYPSE...',
  ],
};

// localStorage key
const DREAMS_STORAGE_KEY = 'spectrascope-dreams';

interface DreamViewProps {
  onBack: () => void;
  onSelectStock?: (symbol: string) => void;
}

export const DreamView = memo(function DreamView({ onBack }: DreamViewProps) {
  const [mode, setMode] = useState<DreamMode>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [savedDreams, setSavedDreams] = useState<SavedDream[]>([]);

  // Backtest state
  const [backtestSymbol, setBacktestSymbol] = useState('');
  const [backtestDate, setBacktestDate] = useState('');
  const [backtestAmount, setBacktestAmount] = useState('1000');
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  // Forecast state
  const [forecastSymbol, setForecastSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [forecastShares, setForecastShares] = useState('');
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);

  // Portfolio projection state
  const [moonProjections, setMoonProjections] = useState<PortfolioProjection[]>([]);
  const [doomProjections, setDoomProjections] = useState<PortfolioProjection[]>([]);

  const { items: watchlistItems, holdings } = useWatchlistStore();
  const { getLatestAnalysis } = useAnalysisStore();

  // Load saved dreams from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DREAMS_STORAGE_KEY);
      if (saved) {
        setSavedDreams(JSON.parse(saved));
      }
    } catch {
      console.warn('Failed to load saved dreams');
    }
  }, []);

  // Save dream to localStorage
  const saveDream = useCallback((dream: SavedDream) => {
    const newDreams = [dream, ...savedDreams].slice(0, 20); // Keep last 20
    setSavedDreams(newDreams);
    localStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(newDreams));
  }, [savedDreams]);

  // Animate status messages
  useEffect(() => {
    if (!isLoading) return;

    const messages = STATUS_MESSAGES[mode as keyof typeof STATUS_MESSAGES] || STATUS_MESSAGES.backtest;
    let index = 0;

    setStatusMessage(messages[0]);
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setStatusMessage(messages[index]);
    }, 1500);

    return () => clearInterval(interval);
  }, [isLoading, mode]);

  // Run backtest
  const runBacktest = async () => {
    if (!backtestSymbol || !backtestDate || !backtestAmount) return;

    setIsLoading(true);
    try {
      // Get historical data
      const { data: historicalData } = await marketData.getDailyData(backtestSymbol.toUpperCase(), 365 * 3);

      if (!historicalData || historicalData.length === 0) {
        throw new Error('No historical data available');
      }

      // Find price on purchase date
      const purchaseDate = new Date(backtestDate);
      const purchaseDateStr = backtestDate;

      // Find closest date to purchase date
      const sortedData = [...historicalData].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let purchasePrice = 0;
      for (const point of sortedData) {
        if (new Date(point.date) >= purchaseDate) {
          purchasePrice = point.close;
          break;
        }
      }

      if (purchasePrice === 0) {
        purchasePrice = sortedData[0]?.close || 100;
      }

      // Get current price
      const currentPrice = historicalData[0]?.close || 0;
      const amount = parseFloat(backtestAmount);
      const sharesOwned = amount / purchasePrice;
      const currentValue = sharesOwned * currentPrice;
      const profit = currentValue - amount;
      const profitPercent = (profit / amount) * 100;

      // Estimate S&P comparison (roughly 10% annual)
      const daysSince = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      const spReturn = (daysSince / 365) * 0.10; // ~10% annual
      const spComparison = amount * (1 + spReturn);

      // Cash comparison (4% savings rate)
      const cashReturn = (daysSince / 365) * 0.04;
      const cashComparison = amount * (1 + cashReturn);

      const result: BacktestResult = {
        symbol: backtestSymbol.toUpperCase(),
        investmentDate: purchaseDateStr,
        investmentAmount: amount,
        purchasePrice,
        currentPrice,
        sharesOwned,
        currentValue,
        profit,
        profitPercent,
        spComparison,
        cashComparison,
      };

      setBacktestResult(result);

      // Save dream
      saveDream({
        id: `backtest-${Date.now()}`,
        type: 'backtest',
        timestamp: new Date().toISOString(),
        title: `${backtestSymbol.toUpperCase()} Backtest`,
        summary: `If I bought ${formatDate(backtestDate)} - ${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(1)}%`,
        data: result,
      });
    } catch (error) {
      console.error('Backtest failed:', error);
    }
    setIsLoading(false);
  };

  // Run forecast
  const runForecast = async () => {
    if (!forecastSymbol || !targetPrice) return;

    setIsLoading(true);
    try {
      const quotes = await marketData.getBulkQuotes([forecastSymbol.toUpperCase()]);
      const quote = quotes.quotes.get(forecastSymbol.toUpperCase());

      if (!quote) {
        throw new Error('Could not fetch current price');
      }

      const currentPrice = quote.price;
      const target = parseFloat(targetPrice);
      const shares = parseFloat(forecastShares) || 0;
      const changeNeeded = ((target - currentPrice) / currentPrice) * 100;

      const result: ForecastResult = {
        symbol: forecastSymbol.toUpperCase(),
        currentPrice,
        targetPrice: target,
        changeNeeded,
        currentShares: shares,
        currentValue: shares * currentPrice,
        targetValue: shares * target,
        potentialProfit: shares * (target - currentPrice),
      };

      setForecastResult(result);

      // Save dream
      saveDream({
        id: `forecast-${Date.now()}`,
        type: 'forecast',
        timestamp: new Date().toISOString(),
        title: `${forecastSymbol.toUpperCase()} Forecast`,
        summary: `Target $${target} - needs ${changeNeeded >= 0 ? '+' : ''}${changeNeeded.toFixed(1)}%`,
        data: result,
      });
    } catch (error) {
      console.error('Forecast failed:', error);
    }
    setIsLoading(false);
  };

  // Run Moon mode
  const runMoonMode = async () => {
    setIsLoading(true);
    const projections: PortfolioProjection[] = [];

    try {
      // Get all holdings
      for (const [symbol, holding] of Object.entries(holdings)) {
        if (holding.shares <= 0) continue;

        // Get current price
        const quotes = await marketData.getBulkQuotes([symbol]);
        const quote = quotes.quotes.get(symbol);
        const currentPrice = quote?.price || 0;

        // Get bull case from analyses
        const analysis = getLatestAnalysis(symbol);
        let targetPrice = currentPrice * 1.3; // Default +30% if no analysis

        if (analysis?.result?.bull) {
          // Parse price target like "+20% to +40%" -> use upper bound
          const target = analysis.result.bull.priceTarget;
          const match = target.match(/([+-]?\d+(?:\.\d+)?)/g);
          if (match && match.length > 0) {
            const percent = parseFloat(match[match.length - 1]);
            targetPrice = currentPrice * (1 + percent / 100);
          }
        }

        const currentValue = holding.shares * currentPrice;
        const targetValue = holding.shares * targetPrice;

        projections.push({
          symbol,
          shares: holding.shares,
          currentPrice,
          targetPrice,
          currentValue,
          targetValue,
          change: targetValue - currentValue,
          changePercent: ((targetValue - currentValue) / currentValue) * 100,
        });
      }

      setMoonProjections(projections);

      // Save dream
      if (projections.length > 0) {
        const totalCurrent = projections.reduce((sum, p) => sum + p.currentValue, 0);
        const totalTarget = projections.reduce((sum, p) => sum + p.targetValue, 0);
        const totalChange = ((totalTarget - totalCurrent) / totalCurrent) * 100;

        saveDream({
          id: `moon-${Date.now()}`,
          type: 'moon',
          timestamp: new Date().toISOString(),
          title: 'Portfolio Moon',
          summary: `When Lambo? - +${totalChange.toFixed(1)}% potential`,
          data: projections,
        });
      }
    } catch (error) {
      console.error('Moon mode failed:', error);
    }
    setIsLoading(false);
  };

  // Run Doom mode
  const runDoomMode = async () => {
    setIsLoading(true);
    const projections: PortfolioProjection[] = [];

    try {
      // Get all holdings
      for (const [symbol, holding] of Object.entries(holdings)) {
        if (holding.shares <= 0) continue;

        // Get current price
        const quotes = await marketData.getBulkQuotes([symbol]);
        const quote = quotes.quotes.get(symbol);
        const currentPrice = quote?.price || 0;

        // Get bear case from analyses
        const analysis = getLatestAnalysis(symbol);
        let targetPrice = currentPrice * 0.7; // Default -30% if no analysis

        if (analysis?.result?.bear) {
          // Parse price target like "-20% to -40%" -> use lower bound
          const target = analysis.result.bear.priceTarget;
          const match = target.match(/([+-]?\d+(?:\.\d+)?)/g);
          if (match && match.length > 0) {
            const percent = parseFloat(match[match.length - 1]);
            targetPrice = currentPrice * (1 + percent / 100);
          }
        }

        const currentValue = holding.shares * currentPrice;
        const targetValue = holding.shares * targetPrice;

        projections.push({
          symbol,
          shares: holding.shares,
          currentPrice,
          targetPrice,
          currentValue,
          targetValue,
          change: targetValue - currentValue,
          changePercent: ((targetValue - currentValue) / currentValue) * 100,
        });
      }

      setDoomProjections(projections);

      // Save dream
      if (projections.length > 0) {
        const totalCurrent = projections.reduce((sum, p) => sum + p.currentValue, 0);
        const totalTarget = projections.reduce((sum, p) => sum + p.targetValue, 0);
        const totalChange = ((totalTarget - totalCurrent) / totalCurrent) * 100;

        saveDream({
          id: `doom-${Date.now()}`,
          type: 'doom',
          timestamp: new Date().toISOString(),
          title: 'Portfolio Doom',
          summary: `Max pain - ${totalChange.toFixed(1)}% risk`,
          data: projections,
        });
      }
    } catch (error) {
      console.error('Doom mode failed:', error);
    }
    setIsLoading(false);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  // Render mode selection menu
  const renderMenu = () => (
    <div className="space-y-4">
      {/* Backtest Card */}
      <button
        onClick={() => setMode('backtest')}
        className="w-full glass-card p-5 text-left hover:bg-slate-800/50 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 flex items-center justify-center">
            <Rewind className="w-7 h-7 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              Backtest
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-slate-400 text-sm">"What if I had bought..."</p>
          </div>
        </div>
      </button>

      {/* Forecast Card */}
      <button
        onClick={() => setMode('forecast')}
        className="w-full glass-card p-5 text-left hover:bg-slate-800/50 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/20 flex items-center justify-center">
            <Target className="w-7 h-7 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              Forecast
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-slate-400 text-sm">"What if price reaches..."</p>
          </div>
        </div>
      </button>

      {/* Moon Mode Card */}
      <button
        onClick={() => {
          setMode('moon');
          runMoonMode();
        }}
        className="w-full glass-card p-5 text-left hover:bg-slate-800/50 transition-all group border-emerald-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-amber-500/20 flex items-center justify-center">
            <Rocket className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              Portfolio Moon
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-slate-400 text-sm">"When Lambo?" - All bull cases</p>
          </div>
        </div>
      </button>

      {/* Doom Mode Card */}
      <button
        onClick={() => {
          setMode('doom');
          runDoomMode();
        }}
        className="w-full glass-card p-5 text-left hover:bg-slate-800/50 transition-all group border-rose-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/30 to-red-900/20 flex items-center justify-center">
            <Skull className="w-7 h-7 text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              Portfolio Doom
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-slate-400 text-sm">"Maximum pain" - All bear cases</p>
          </div>
        </div>
      </button>

      {/* Saved Dreams */}
      {savedDreams.length > 0 && (
        <div className="mt-8">
          <h3 className="text-slate-400 text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            My Dreams
          </h3>
          <div className="space-y-2">
            {savedDreams.slice(0, 5).map((dream) => (
              <div
                key={dream.id}
                className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{dream.title}</p>
                    <p className="text-slate-500 text-xs">{dream.summary}</p>
                  </div>
                  <span className="text-slate-600 text-xs">
                    {formatDate(dream.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render backtest mode
  const renderBacktest = () => (
    <div className="space-y-6">
      {/* Input Form */}
      {!backtestResult && !isLoading && (
        <div className="space-y-4">
          {/* Symbol */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Stock Symbol</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={backtestSymbol}
                onChange={(e) => setBacktestSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., NVDA"
                className="input-field pl-12 uppercase"
              />
            </div>
            {/* Quick select from watchlist */}
            {watchlistItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {watchlistItems.slice(0, 5).map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => setBacktestSymbol(item.symbol)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      backtestSymbol === item.symbol
                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-400'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {item.symbol}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Purchase Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="date"
                value={backtestDate}
                onChange={(e) => setBacktestDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="input-field pl-12"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Investment Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="number"
                value={backtestAmount}
                onChange={(e) => setBacktestAmount(e.target.value)}
                placeholder="1000"
                className="input-field pl-12"
              />
            </div>
          </div>

          <button
            onClick={runBacktest}
            disabled={!backtestSymbol || !backtestDate || !backtestAmount}
            className="w-full btn-primary bg-gradient-to-r from-violet-600 to-purple-500 disabled:opacity-50"
          >
            Dream It
          </button>
        </div>
      )}

      {/* Result */}
      {backtestResult && !isLoading && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <p className="text-slate-400 text-sm">If you invested {formatCurrency(backtestResult.investmentAmount)} in</p>
            <h2 className="text-3xl font-bold text-gradient-dream">{backtestResult.symbol}</h2>
            <p className="text-slate-400 text-sm">on {formatDate(backtestResult.investmentDate)}...</p>
          </div>

          {/* Current Value */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">You would have:</span>
              <span className="text-2xl font-bold text-white">{formatCurrency(backtestResult.currentValue)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Profit:</span>
              <span className={`font-semibold ${backtestResult.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {backtestResult.profit >= 0 ? '+' : ''}{formatCurrency(backtestResult.profit)}
                ({backtestResult.profitPercent >= 0 ? '+' : ''}{backtestResult.profitPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Shares owned:</span>
              <span className="text-white">{backtestResult.sharesOwned.toFixed(4)} shares</span>
            </div>
          </div>

          {/* Comparisons */}
          <div className="glass-card p-5">
            <h4 className="text-slate-400 text-sm mb-3">Comparison</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">vs. S&P 500:</span>
                <span className="text-slate-300">
                  {formatCurrency(backtestResult.spComparison)}
                  <span className="text-slate-500 text-sm ml-1">
                    (+{(((backtestResult.spComparison - backtestResult.investmentAmount) / backtestResult.investmentAmount) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">vs. Cash (4%):</span>
                <span className="text-slate-300">
                  {formatCurrency(backtestResult.cashComparison)}
                  <span className="text-slate-500 text-sm ml-1">
                    (+{(((backtestResult.cashComparison - backtestResult.investmentAmount) / backtestResult.investmentAmount) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 text-center">
            <p className="text-violet-300">
              {backtestResult.profitPercent > 0
                ? `You would have outperformed S&P by ${(backtestResult.profitPercent - ((backtestResult.spComparison - backtestResult.investmentAmount) / backtestResult.investmentAmount * 100)).toFixed(1)}%!`
                : `The S&P would have been a better choice this time.`
              }
            </p>
          </div>

          <button
            onClick={() => {
              setBacktestResult(null);
              setBacktestSymbol('');
              setBacktestDate('');
            }}
            className="w-full py-3 text-violet-400 hover:text-violet-300 transition-colors"
          >
            Try Another Dream
          </button>
        </div>
      )}
    </div>
  );

  // Render forecast mode
  const renderForecast = () => (
    <div className="space-y-6">
      {/* Input Form */}
      {!forecastResult && !isLoading && (
        <div className="space-y-4">
          {/* Symbol */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Stock Symbol</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={forecastSymbol}
                onChange={(e) => setForecastSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., TSLA"
                className="input-field pl-12 uppercase"
              />
            </div>
          </div>

          {/* Target Price */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Target Price</label>
            <div className="relative">
              <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="500"
                className="input-field pl-12"
              />
            </div>
          </div>

          {/* Current Holdings (optional) */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Your Shares (optional)</label>
            <input
              type="number"
              value={forecastShares}
              onChange={(e) => setForecastShares(e.target.value)}
              placeholder="0"
              className="input-field"
            />
          </div>

          <button
            onClick={runForecast}
            disabled={!forecastSymbol || !targetPrice}
            className="w-full btn-primary bg-gradient-to-r from-purple-600 to-indigo-500 disabled:opacity-50"
          >
            See the Future
          </button>
        </div>
      )}

      {/* Result */}
      {forecastResult && !isLoading && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <p className="text-slate-400 text-sm">If</p>
            <h2 className="text-3xl font-bold text-gradient-dream">{forecastResult.symbol}</h2>
            <p className="text-slate-400 text-sm">reaches ${forecastResult.targetPrice.toFixed(2)}...</p>
          </div>

          {/* Change Needed */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Current Price:</span>
              <span className="text-white font-semibold">{formatCurrency(forecastResult.currentPrice)}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Target Price:</span>
              <span className="text-violet-400 font-semibold">{formatCurrency(forecastResult.targetPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Change Needed:</span>
              <span className={`font-bold text-lg ${forecastResult.changeNeeded >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {forecastResult.changeNeeded >= 0 ? '+' : ''}{forecastResult.changeNeeded.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Holdings Projection */}
          {forecastResult.currentShares > 0 && (
            <div className="glass-card p-5">
              <h4 className="text-slate-400 text-sm mb-3">Your {forecastResult.currentShares} shares:</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Value:</span>
                  <span className="text-white">{formatCurrency(forecastResult.currentValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Value:</span>
                  <span className="text-violet-400 font-semibold">{formatCurrency(forecastResult.targetValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Potential Profit:</span>
                  <span className={`font-semibold ${forecastResult.potentialProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {forecastResult.potentialProfit >= 0 ? '+' : ''}{formatCurrency(forecastResult.potentialProfit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setForecastResult(null);
              setForecastSymbol('');
              setTargetPrice('');
              setForecastShares('');
            }}
            className="w-full py-3 text-purple-400 hover:text-purple-300 transition-colors"
          >
            Try Another Dream
          </button>
        </div>
      )}
    </div>
  );

  // Render Moon mode
  const renderMoon = () => {
    const totalCurrent = moonProjections.reduce((sum, p) => sum + p.currentValue, 0);
    const totalTarget = moonProjections.reduce((sum, p) => sum + p.targetValue, 0);
    const totalProfit = totalTarget - totalCurrent;
    const totalChangePercent = totalCurrent > 0 ? ((totalTarget - totalCurrent) / totalCurrent) * 100 : 0;

    // Lambo calculator
    const lamboPrice = 300000;
    const rolexPrice = 15000;
    const gmePrice = 27;
    const tendiePrice = 1;

    return (
      <div className="space-y-4">
        {!isLoading && moonProjections.length > 0 && (
          <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2 animate-rocket-shake inline-block">🚀</div>
              <h2 className="text-2xl font-bold text-gradient-bull">PORTFOLIO MOON MODE</h2>
              <p className="text-slate-400 text-sm">"When Lambo?"</p>
            </div>

            {/* Summary Card */}
            <div className="glass-card p-5 border-emerald-500/30 mb-4">
              <p className="text-slate-400 text-sm mb-2">If ALL holdings hit BULL CASE targets:</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">Current Portfolio:</span>
                <span className="text-white font-semibold">{formatCurrency(totalCurrent)}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">Moon Portfolio:</span>
                <span className="text-2xl font-bold text-emerald-400">{formatCurrency(totalTarget)} 🌙</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Gains:</span>
                <span className="text-emerald-400 font-semibold">
                  +{formatCurrency(totalProfit)} (+{totalChangePercent.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="glass-card p-5 mb-4">
              <h4 className="text-slate-400 text-sm mb-3">Breakdown:</h4>
              <div className="space-y-3">
                {moonProjections.map((p) => (
                  <div key={p.symbol} className="flex items-center justify-between">
                    <span className="text-white font-medium">{p.symbol}</span>
                    <div className="text-right">
                      <span className="text-slate-400">${p.currentPrice.toFixed(0)} → </span>
                      <span className="text-emerald-400">${p.targetPrice.toFixed(0)}</span>
                      <span className="text-emerald-400/70 text-sm ml-2">(+{p.changePercent.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* When Lambo Calculator */}
            <div className="bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-xl p-5">
              <h4 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                🏎️ WHEN LAMBO CALCULATOR
              </h4>
              <p className="text-slate-400 text-sm mb-3">Your +{formatCurrency(totalProfit)} profit buys you:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>🏎️ Lamborghinis</span>
                  <span className="text-amber-400">{(totalProfit / lamboPrice).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>⌚ Rolex Submariners</span>
                  <span className="text-amber-400">{(totalProfit / rolexPrice).toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🦍 Shares of GME</span>
                  <span className="text-amber-400">{Math.floor(totalProfit / gmePrice).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🍗 Chicken tendies</span>
                  <span className="text-amber-400">{Math.floor(totalProfit / tendiePrice).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-emerald-400 text-center mt-4 font-medium">
                💎🙌 "Keep diamond handing, king!"
              </p>
            </div>

            <button
              onClick={() => setMode('menu')}
              className="w-full py-3 text-emerald-400 hover:text-emerald-300 transition-colors mt-4"
            >
              Back to Dreams
            </button>
          </div>
        )}

        {!isLoading && moonProjections.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-400">No holdings found</p>
            <p className="text-slate-500 text-sm mt-1">Add some shares to your portfolio first</p>
            <button
              onClick={() => setMode('menu')}
              className="mt-4 text-violet-400 hover:text-violet-300"
            >
              Back to Dreams
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render Doom mode
  const renderDoom = () => {
    const totalCurrent = doomProjections.reduce((sum, p) => sum + p.currentValue, 0);
    const totalTarget = doomProjections.reduce((sum, p) => sum + p.targetValue, 0);
    const totalLoss = totalTarget - totalCurrent;
    const totalChangePercent = totalCurrent > 0 ? ((totalTarget - totalCurrent) / totalCurrent) * 100 : 0;

    // Damage report
    const starbucksPrice = 7;
    const netflixMonthly = 15;
    const ramenPrice = 0.50;

    return (
      <div className="space-y-4">
        {!isLoading && doomProjections.length > 0 && (
          <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2 animate-skull-float inline-block">💀</div>
              <h2 className="text-2xl font-bold text-gradient-bear">PORTFOLIO DOOM MODE</h2>
              <p className="text-slate-400 text-sm">"Maximum Pain"</p>
            </div>

            {/* Summary Card */}
            <div className="glass-card p-5 border-rose-500/30 mb-4">
              <p className="text-slate-400 text-sm mb-2">If ALL holdings hit BEAR CASE targets:</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">Current Portfolio:</span>
                <span className="text-white font-semibold">{formatCurrency(totalCurrent)}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">Doom Portfolio:</span>
                <span className="text-2xl font-bold text-rose-400">{formatCurrency(totalTarget)} 💀</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Losses:</span>
                <span className="text-rose-400 font-semibold">
                  {formatCurrency(totalLoss)} ({totalChangePercent.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="glass-card p-5 mb-4">
              <h4 className="text-slate-400 text-sm mb-3">Breakdown:</h4>
              <div className="space-y-3">
                {doomProjections.map((p) => (
                  <div key={p.symbol} className="flex items-center justify-between">
                    <span className="text-white font-medium">{p.symbol}</span>
                    <div className="text-right">
                      <span className="text-slate-400">${p.currentPrice.toFixed(0)} → </span>
                      <span className="text-rose-400">${p.targetPrice.toFixed(0)}</span>
                      <span className="text-rose-400/70 text-sm ml-2">({p.changePercent.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Damage Report */}
            <div className="bg-gradient-to-br from-rose-500/10 to-red-900/10 border border-rose-500/30 rounded-xl p-5">
              <h4 className="text-rose-400 font-semibold mb-3 flex items-center gap-2">
                📉 DAMAGE REPORT
              </h4>
              <p className="text-slate-400 text-sm mb-3">Your {formatCurrency(Math.abs(totalLoss))} loss equals:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>☕ Cups of Starbucks</span>
                  <span className="text-rose-400">{Math.floor(Math.abs(totalLoss) / starbucksPrice).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>📺 Months of Netflix</span>
                  <span className="text-rose-400">{Math.floor(Math.abs(totalLoss) / netflixMonthly).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🍜 Sad instant ramens</span>
                  <span className="text-rose-400">{Math.floor(Math.abs(totalLoss) / ramenPrice).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>📅 Years of ramen life</span>
                  <span className="text-rose-400">{(Math.abs(totalLoss) / ramenPrice / 365).toFixed(1)}</span>
                </div>
              </div>
              <p className="text-rose-400 text-center mt-4 font-medium">
                😢 "Consider hedging... or buying more ramen"
              </p>
            </div>

            <button
              onClick={() => setMode('menu')}
              className="w-full py-3 text-rose-400 hover:text-rose-300 transition-colors mt-4"
            >
              Back to Dreams
            </button>
          </div>
        )}

        {!isLoading && doomProjections.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-400">No holdings found</p>
            <p className="text-slate-500 text-sm mt-1">Add some shares to your portfolio first</p>
            <button
              onClick={() => setMode('menu')}
              className="mt-4 text-violet-400 hover:text-violet-300"
            >
              Back to Dreams
            </button>
          </div>
        )}
      </div>
    );
  };

  // Get background class based on mode
  const getBgClass = () => {
    if (mode === 'moon') return 'dream-bg-moon';
    if (mode === 'doom') return 'dream-bg-doom';
    return 'dream-bg';
  };

  return (
    <div className={`min-h-screen bg-black pb-24 ${getBgClass()}`}>
      {/* Floating clouds/stars decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <Cloud className="absolute top-20 left-10 w-16 h-16 text-violet-500/10 animate-cloud-1" />
        <Cloud className="absolute top-40 right-20 w-24 h-24 text-purple-500/10 animate-cloud-2" />
        <Cloud className="absolute bottom-40 left-1/4 w-20 h-20 text-violet-500/10 animate-cloud-3" />
        <Star className="absolute top-32 right-1/4 w-3 h-3 text-violet-400/30 animate-twinkle" />
        <Star className="absolute top-48 left-1/3 w-2 h-2 text-purple-400/30 animate-twinkle-slow" />
        <Star className="absolute bottom-60 right-1/3 w-3 h-3 text-violet-400/20 animate-twinkle-fast" />
        <Sparkles className="absolute top-60 right-10 w-4 h-4 text-violet-400/20 animate-twinkle" />
      </div>

      {/* Header */}
      <Header
        title={mode === 'menu' ? 'Dream' : mode === 'backtest' ? 'Backtest' : mode === 'forecast' ? 'Forecast' : mode === 'moon' ? 'Moon Mode' : 'Doom Mode'}
        subtitle={mode === 'menu' ? 'What if...?' : undefined}
        showBack={mode !== 'menu'}
        onBack={mode === 'menu' ? onBack : () => {
          if (mode === 'backtest') setBacktestResult(null);
          if (mode === 'forecast') setForecastResult(null);
          setMode('menu');
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            {mode === 'moon' ? (
              <div className="text-6xl mb-4 animate-rocket-shake">🚀</div>
            ) : mode === 'doom' ? (
              <div className="text-6xl mb-4 animate-skull-float">💀</div>
            ) : (
              <Moon className="w-16 h-16 text-violet-400 mx-auto mb-4 animate-moon-glow" />
            )}
            <p className="text-gradient-dream text-lg font-medium">{statusMessage}</p>
            <Loader2 className="w-6 h-6 text-violet-400 mx-auto mt-4 animate-spin" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-5 py-4 relative z-10">
        {mode === 'menu' && renderMenu()}
        {mode === 'backtest' && renderBacktest()}
        {mode === 'forecast' && renderForecast()}
        {mode === 'moon' && renderMoon()}
        {mode === 'doom' && renderDoom()}
      </div>

      {/* Disclaimer */}
      <div className="px-5 mt-4">
        <p className="text-slate-600 text-xs text-center">
          For entertainment only - not financial advice
        </p>
      </div>
    </div>
  );
});

export default DreamView;
