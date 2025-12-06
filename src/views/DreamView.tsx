/**
 * DreamView - "What if...?" scenarios
 *
 * Features:
 * - Backtest: What if I had bought...
 * - Forecast: What if price reaches...
 * - Moon Mode: All bull cases - When Lambo?
 * - Doom Mode: All bear cases - Maximum Pain
 */

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
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
  Plus,
  Trash2,
  Save,
  X,
  Archive,
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
  hasAnalysis: boolean; // Whether this projection is based on AI analysis
}

interface SavedDream {
  id: string;
  type: DreamMode;
  timestamp: string;
  title: string;
  summary: string;
  data: BacktestResult | ForecastResult | PortfolioProjection[];
}

// Exit Strategy types
interface SellPoint {
  id: string;
  price: number;
  percent: number; // % of holdings to sell
}

interface ExitPlan {
  id: string;
  symbol: string;
  shares: number;
  costBasis: number;
  sellPoints: SellPoint[];
  taxRate: number;
  timestamp: string;
}

// Exit plans storage key
const EXIT_PLANS_STORAGE_KEY = 'spectrascope-exit-plans';

// Status messages for each mode
const STATUS_MESSAGES = {
  backtest: [
    'DRIFTING INTO THE CLOUDS... ☁️',
    'CONSULTING THE CRYSTAL BALL 🔮...',
    'TRAVELING THROUGH TIME... ⏪',
    'ASKING THE MOON... 🌙',
  ],
  forecast: [
    'CONSULTING THE CRYSTAL BALL 🔮...',
    'ASKING THE MOON... 🌙',
    'READING THE STARS... ✨',
    'CHANNELING THE ORACLE... 🔮',
  ],
  moon: [
    'STRAPPING INTO THE ROCKET... 🚀',
    'DESTINATION: MOON 🌙',
    'CALCULATING TENDIES... 🍗',
    'WHEN LAMBO? SOON™ 🏎️',
    'DIAMOND HANDS ACTIVATED 💎🙌',
    'CHECKING SQUEEZE STATUS... 📈',
    'TO THE MOON! 🚀🚀🚀',
  ],
  doom: [
    'ENTERING THE VOID... 🕳️',
    'CONSULTING THE BEARS 🐻...',
    'CALCULATING MAXIMUM PAIN... 💀',
    'PAPER HANDS DETECTED 📄🙌...',
    'F IN CHAT... 😢',
    'HEDGING THE APOCALYPSE... ☠️',
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
  const [forecastCurrentPrice, setForecastCurrentPrice] = useState<number | null>(null);
  const [targetPercent, setTargetPercent] = useState<number>(10);
  const [showStockDropdown, setShowStockDropdown] = useState(false);

  // Backtest new state
  const [showBacktestDropdown, setShowBacktestDropdown] = useState(false);

  // Exit Strategy state
  const [showExitPlanner, setShowExitPlanner] = useState(false);
  const [sellPoints, setSellPoints] = useState<SellPoint[]>([]);
  const [taxRate, setTaxRate] = useState(25);
  const [newSellPrice, setNewSellPrice] = useState('');
  const [newSellPercent, setNewSellPercent] = useState('');
  const [savedExitPlans, setSavedExitPlans] = useState<ExitPlan[]>([]);

  // Portfolio projection state
  const [moonProjections, setMoonProjections] = useState<PortfolioProjection[]>([]);
  const [doomProjections, setDoomProjections] = useState<PortfolioProjection[]>([]);

  // Archive modal state
  const [showDreamArchive, setShowDreamArchive] = useState(false);
  const [selectedDream, setSelectedDream] = useState<SavedDream | null>(null);

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

  // Load saved exit plans from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EXIT_PLANS_STORAGE_KEY);
      if (saved) {
        setSavedExitPlans(JSON.parse(saved));
      }
    } catch {
      console.warn('Failed to load saved exit plans');
    }
  }, []);

  // Auto-fill shares and fetch current price when forecast symbol changes
  useEffect(() => {
    if (!forecastSymbol) {
      setForecastCurrentPrice(null);
      setForecastShares('');
      return;
    }

    // Auto-fill shares from portfolio
    const holding = holdings[forecastSymbol.toUpperCase()];
    if (holding && holding.shares > 0) {
      setForecastShares(holding.shares.toString());
    }

    // Fetch current price
    const fetchPrice = async () => {
      try {
        const quotes = await marketData.getBulkQuotes([forecastSymbol.toUpperCase()]);
        const quote = quotes.quotes.get(forecastSymbol.toUpperCase());
        if (quote) {
          setForecastCurrentPrice(quote.price);
          // Update target price based on current percent
          setTargetPrice((quote.price * (1 + targetPercent / 100)).toFixed(2));
        }
      } catch (err) {
        console.warn('Failed to fetch price for', forecastSymbol);
      }
    };
    fetchPrice();
  }, [forecastSymbol, holdings]);

  // Update target price when percent slider changes
  useEffect(() => {
    if (forecastCurrentPrice) {
      setTargetPrice((forecastCurrentPrice * (1 + targetPercent / 100)).toFixed(2));
    }
  }, [targetPercent, forecastCurrentPrice]);

  // Combined list of stocks for dropdown (portfolio + watchlist)
  const allStocksForDropdown = useMemo(() => {
    const portfolioStocks = Object.entries(holdings)
      .filter(([_, h]) => h.shares > 0)
      .map(([symbol, h]) => ({ symbol, name: watchlistItems.find(w => w.symbol === symbol)?.name || symbol, shares: h.shares, isPortfolio: true }));

    const watchlistOnly = watchlistItems
      .filter(w => !holdings[w.symbol] || holdings[w.symbol].shares === 0)
      .map(w => ({ symbol: w.symbol, name: w.name, shares: 0, isPortfolio: false }));

    return { portfolio: portfolioStocks, watchlist: watchlistOnly };
  }, [holdings, watchlistItems]);

  // Save dream to localStorage
  const saveDream = useCallback((dream: SavedDream) => {
    const newDreams = [dream, ...savedDreams].slice(0, 20); // Keep last 20
    setSavedDreams(newDreams);
    localStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(newDreams));
  }, [savedDreams]);

  // Exit Strategy helpers
  const addSellPoint = useCallback(() => {
    if (!newSellPrice || !newSellPercent) return;

    const totalPercent = sellPoints.reduce((sum, p) => sum + p.percent, 0);
    const newPercent = parseFloat(newSellPercent);

    if (totalPercent + newPercent > 100) {
      return; // Can't exceed 100%
    }

    const newPoint: SellPoint = {
      id: `sp-${Date.now()}`,
      price: parseFloat(newSellPrice),
      percent: newPercent,
    };

    setSellPoints([...sellPoints, newPoint].sort((a, b) => a.price - b.price));
    setNewSellPrice('');
    setNewSellPercent('');
  }, [newSellPrice, newSellPercent, sellPoints]);

  const removeSellPoint = useCallback((id: string) => {
    setSellPoints(sellPoints.filter((p) => p.id !== id));
  }, [sellPoints]);

  const sellRemainingPercent = useCallback(() => {
    const totalPercent = sellPoints.reduce((sum, p) => sum + p.percent, 0);
    const remaining = 100 - totalPercent;
    if (remaining <= 0 || !forecastResult) return;

    const newPoint: SellPoint = {
      id: `sp-${Date.now()}`,
      price: forecastResult.targetPrice,
      percent: remaining,
    };

    setSellPoints([...sellPoints, newPoint].sort((a, b) => a.price - b.price));
  }, [sellPoints, forecastResult]);

  const calculateExitResults = useCallback(() => {
    if (!forecastResult || sellPoints.length === 0) return null;

    const shares = forecastResult.currentShares;
    const costBasis = forecastResult.currentValue;

    let grossProceeds = 0;

    sellPoints.forEach((point) => {
      const sharesToSell = shares * (point.percent / 100);
      grossProceeds += sharesToSell * point.price;
    });

    const totalSoldPercent = sellPoints.reduce((sum, p) => sum + p.percent, 0);
    const grossProfit = grossProceeds - (costBasis * totalSoldPercent / 100);
    const taxes = grossProfit > 0 ? grossProfit * (taxRate / 100) : 0;
    const netProfit = grossProfit - taxes;

    // Calculate average sell price
    let weightedPriceSum = 0;
    sellPoints.forEach((point) => {
      weightedPriceSum += point.price * point.percent;
    });
    const avgSellPrice = totalSoldPercent > 0 ? weightedPriceSum / totalSoldPercent : 0;

    // vs selling all now
    const sellAllNow = shares * forecastResult.currentPrice;
    const vsNow = grossProceeds - sellAllNow;

    // vs selling all at target
    const sellAllTarget = shares * forecastResult.targetPrice;
    const vsTarget = grossProceeds - sellAllTarget;

    return {
      grossProceeds,
      costBasis: costBasis * totalSoldPercent / 100,
      grossProfit,
      taxes,
      netProfit,
      netProfitPercent: costBasis > 0 ? (netProfit / (costBasis * totalSoldPercent / 100)) * 100 : 0,
      avgSellPrice,
      vsNow,
      vsTarget,
      totalSoldPercent,
    };
  }, [forecastResult, sellPoints, taxRate]);

  const saveExitPlan = useCallback(() => {
    if (!forecastResult || sellPoints.length === 0) return;

    const plan: ExitPlan = {
      id: `exit-${Date.now()}`,
      symbol: forecastResult.symbol,
      shares: forecastResult.currentShares,
      costBasis: forecastResult.currentValue,
      sellPoints: [...sellPoints],
      taxRate,
      timestamp: new Date().toISOString(),
    };

    const newPlans = [plan, ...savedExitPlans].slice(0, 20);
    setSavedExitPlans(newPlans);
    localStorage.setItem(EXIT_PLANS_STORAGE_KEY, JSON.stringify(newPlans));

    // Also save as a dream
    const results = calculateExitResults();
    if (results) {
      saveDream({
        id: `exit-dream-${Date.now()}`,
        type: 'forecast',
        timestamp: new Date().toISOString(),
        title: `${forecastResult.symbol} Exit Plan`,
        summary: `${sellPoints.length} sell points - Net +${results.netProfitPercent.toFixed(1)}% after tax`,
        data: forecastResult,
      });
    }
  }, [forecastResult, sellPoints, taxRate, savedExitPlans, calculateExitResults, saveDream]);

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
        let hasAnalysis = false;

        if (analysis?.result?.bull) {
          // Parse price target like "+20% to +40%" -> use upper bound
          const target = analysis.result.bull.priceTarget;
          const match = target.match(/([+-]?\d+(?:\.\d+)?)/g);
          if (match && match.length > 0) {
            const percent = parseFloat(match[match.length - 1]);
            targetPrice = currentPrice * (1 + percent / 100);
            hasAnalysis = true;
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
          hasAnalysis,
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
        let hasAnalysis = false;

        if (analysis?.result?.bear) {
          // Parse price target like "-20% to -40%" -> use lower bound
          const target = analysis.result.bear.priceTarget;
          const match = target.match(/([+-]?\d+(?:\.\d+)?)/g);
          if (match && match.length > 0) {
            const percent = parseFloat(match[match.length - 1]);
            targetPrice = currentPrice * (1 + percent / 100);
            hasAnalysis = true;
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
          hasAnalysis,
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-400 text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              My Dreams
            </h3>
            {savedDreams.length > 3 && (
              <button
                onClick={() => setShowDreamArchive(true)}
                className="text-violet-400 text-xs flex items-center gap-1 hover:text-violet-300 transition-colors"
              >
                <Archive className="w-3 h-3" />
                View All ({savedDreams.length})
              </button>
            )}
          </div>
          <div className="space-y-2">
            {savedDreams.slice(0, 3).map((dream) => (
              <button
                key={dream.id}
                onClick={() => setSelectedDream(dream)}
                className="w-full bg-slate-900/50 border border-slate-800/50 rounded-xl p-3 text-left hover:bg-slate-800/50 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{dream.title}</p>
                    <p className="text-slate-500 text-xs truncate">{dream.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-slate-600 text-xs whitespace-nowrap">
                      {formatDate(dream.timestamp)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Helper to get date X years ago
  const getDateYearsAgo = (years: number) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date.toISOString().split('T')[0];
  };

  // Render backtest mode
  const renderBacktest = () => (
    <div className="space-y-6">
      {/* Input Form */}
      {!backtestResult && !isLoading && (
        <div className="space-y-4">
          {/* Stock Selection with Dropdown */}
          <div className="relative">
            <label className="text-slate-400 text-sm mb-2 block">Select Stock</label>
            <button
              onClick={() => setShowBacktestDropdown(!showBacktestDropdown)}
              className="w-full input-field text-left flex items-center justify-between"
            >
              {backtestSymbol ? (
                <span className="text-white">
                  {backtestSymbol} - {watchlistItems.find(w => w.symbol === backtestSymbol)?.name || backtestSymbol}
                </span>
              ) : (
                <span className="text-slate-500">Choose a stock...</span>
              )}
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showBacktestDropdown ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown */}
            {showBacktestDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl max-h-64 overflow-y-auto z-50">
                {/* Portfolio Section */}
                {allStocksForDropdown.portfolio.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs text-slate-500 font-medium border-b border-slate-700">
                      📁 Portfolio
                    </div>
                    {allStocksForDropdown.portfolio.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => {
                          setBacktestSymbol(stock.symbol);
                          setShowBacktestDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-700/50 flex items-center justify-between"
                      >
                        <span className="text-white">{stock.symbol} <span className="text-slate-400">- {stock.name}</span></span>
                        <span className="text-purple-400 text-sm">{stock.shares} shares</span>
                      </button>
                    ))}
                  </>
                )}

                {/* Watchlist Section */}
                {allStocksForDropdown.watchlist.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs text-slate-500 font-medium border-b border-slate-700">
                      👁️ Watchlist
                    </div>
                    {allStocksForDropdown.watchlist.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => {
                          setBacktestSymbol(stock.symbol);
                          setShowBacktestDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-700/50"
                      >
                        <span className="text-white">{stock.symbol} <span className="text-slate-400">- {stock.name}</span></span>
                      </button>
                    ))}
                  </>
                )}

                {/* Manual Entry */}
                <div className="px-3 py-2 border-t border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={backtestSymbol}
                      onChange={(e) => setBacktestSymbol(e.target.value.toUpperCase())}
                      placeholder="Or type symbol..."
                      className="w-full bg-slate-700 border-0 rounded-lg py-2 pl-9 pr-3 text-white text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date with Presets */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Purchase Date</label>

            {/* Quick Date Presets */}
            <div className="flex gap-2 mb-2">
              {[
                { label: '1Y ago', years: 1 },
                { label: '2Y ago', years: 2 },
                { label: '3Y ago', years: 3 },
                { label: '5Y ago', years: 5 },
              ].map((preset) => (
                <button
                  key={preset.years}
                  onClick={() => setBacktestDate(getDateYearsAgo(preset.years))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    backtestDate === getDateYearsAgo(preset.years)
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

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

          {/* Amount with Presets */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Investment Amount</label>

            {/* Quick Amount Presets */}
            <div className="flex gap-2 mb-2">
              {['100', '500', '1000', '5000', '10000'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBacktestAmount(amount)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    backtestAmount === amount
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  ${Number(amount) >= 1000 ? `${Number(amount) / 1000}K` : amount}
                </button>
              ))}
            </div>

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
          {/* Stock Selection with Dropdown */}
          <div className="relative">
            <label className="text-slate-400 text-sm mb-2 block">Select Stock</label>
            <button
              onClick={() => setShowStockDropdown(!showStockDropdown)}
              className="w-full input-field text-left flex items-center justify-between"
            >
              {forecastSymbol ? (
                <span className="text-white">
                  {forecastSymbol} - {watchlistItems.find(w => w.symbol === forecastSymbol)?.name || forecastSymbol}
                  {holdings[forecastSymbol]?.shares > 0 && (
                    <span className="text-purple-400 ml-2">({holdings[forecastSymbol].shares} shares)</span>
                  )}
                </span>
              ) : (
                <span className="text-slate-500">Choose a stock...</span>
              )}
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showStockDropdown ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown */}
            {showStockDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl max-h-64 overflow-y-auto z-50">
                {/* Portfolio Section */}
                {allStocksForDropdown.portfolio.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs text-slate-500 font-medium border-b border-slate-700">
                      📁 Portfolio
                    </div>
                    {allStocksForDropdown.portfolio.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => {
                          setForecastSymbol(stock.symbol);
                          setShowStockDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-700/50 flex items-center justify-between"
                      >
                        <span className="text-white">{stock.symbol} <span className="text-slate-400">- {stock.name}</span></span>
                        <span className="text-purple-400 text-sm">{stock.shares} shares</span>
                      </button>
                    ))}
                  </>
                )}

                {/* Watchlist Section */}
                {allStocksForDropdown.watchlist.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs text-slate-500 font-medium border-b border-slate-700">
                      👁️ Watchlist
                    </div>
                    {allStocksForDropdown.watchlist.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => {
                          setForecastSymbol(stock.symbol);
                          setShowStockDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-700/50"
                      >
                        <span className="text-white">{stock.symbol} <span className="text-slate-400">- {stock.name}</span></span>
                      </button>
                    ))}
                  </>
                )}

                {/* Manual Entry */}
                <div className="px-3 py-2 border-t border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={forecastSymbol}
                      onChange={(e) => setForecastSymbol(e.target.value.toUpperCase())}
                      placeholder="Or type symbol..."
                      className="w-full bg-slate-700 border-0 rounded-lg py-2 pl-9 pr-3 text-white text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current Price Display */}
          {forecastCurrentPrice && (
            <div className="glass-card p-3 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Current Price:</span>
              <span className="text-white font-semibold">${forecastCurrentPrice.toFixed(2)}</span>
            </div>
          )}

          {/* Target Price with Slider */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Target Price</label>

            {/* Quick Percent Presets */}
            <div className="flex gap-2 mb-3">
              {[5, 10, 25, 50, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => setTargetPercent(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    targetPercent === p
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  +{p}%
                </button>
              ))}
            </div>

            {/* Custom Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min={-50}
                max={200}
                value={targetPercent}
                onChange={(e) => setTargetPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>-50%</span>
                <span className={`font-medium ${targetPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {targetPercent >= 0 ? '+' : ''}{targetPercent}%
                </span>
                <span>+200%</span>
              </div>
            </div>

            {/* Target Price Result */}
            <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Target:</span>
                <span className="text-purple-400 font-bold text-lg">
                  ${targetPrice || '0.00'}
                  {forecastCurrentPrice && (
                    <span className="text-sm ml-2 text-slate-400">
                      ({targetPercent >= 0 ? '+' : ''}{targetPercent}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Shares Input with Auto-fill */}
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Your Shares</label>
            <input
              type="number"
              value={forecastShares}
              onChange={(e) => setForecastShares(e.target.value)}
              placeholder="0"
              className="input-field"
            />
            {holdings[forecastSymbol]?.shares > 0 && forecastShares === holdings[forecastSymbol].shares.toString() && (
              <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                ✓ Auto-filled from portfolio
              </p>
            )}
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

              {/* Exit Strategy Builder Toggle */}
              <button
                onClick={() => setShowExitPlanner(!showExitPlanner)}
                className="w-full mt-4 py-2 px-4 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" />
                {showExitPlanner ? 'Hide Exit Planner' : 'Plan Exit Strategy'}
              </button>
            </div>
          )}

          {/* Exit Strategy Builder */}
          {showExitPlanner && forecastResult.currentShares > 0 && (
            <div className="glass-card p-5 border-purple-500/30 animate-fade-in">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                🎯 Exit Strategy Builder
              </h4>

              <div className="text-slate-400 text-sm mb-4">
                {forecastResult.symbol} • {forecastResult.currentShares} shares @ {formatCurrency(forecastResult.currentPrice)} = {formatCurrency(forecastResult.currentValue)}
              </div>

              {/* Current Sell Points */}
              {sellPoints.length > 0 && (
                <div className="space-y-2 mb-4">
                  {sellPoints.map((point, index) => {
                    const sharesToSell = forecastResult.currentShares * (point.percent / 100);
                    return (
                      <div
                        key={point.id}
                        className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 text-sm">#{index + 1}</span>
                          <div>
                            <span className="text-emerald-400 font-medium">${point.price.toFixed(0)}</span>
                            <span className="text-slate-400 text-sm ml-2">{point.percent}%</span>
                            <span className="text-slate-500 text-xs ml-2">({sharesToSell.toFixed(2)} shares)</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeSellPoint(point.id)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700">
                    <span className="text-slate-400">Total:</span>
                    <span className={`font-semibold ${sellPoints.reduce((s, p) => s + p.percent, 0) === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {sellPoints.reduce((s, p) => s + p.percent, 0)}% {sellPoints.reduce((s, p) => s + p.percent, 0) === 100 && '✓'}
                    </span>
                  </div>
                </div>
              )}

              {/* Add Sell Point */}
              {sellPoints.reduce((s, p) => s + p.percent, 0) < 100 && (
                <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={newSellPrice}
                      onChange={(e) => setNewSellPrice(e.target.value)}
                      placeholder="Price $"
                      className="input-field text-sm py-2"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      value={newSellPercent}
                      onChange={(e) => setNewSellPercent(e.target.value)}
                      placeholder="%"
                      max={100 - sellPoints.reduce((s, p) => s + p.percent, 0)}
                      className="input-field text-sm py-2"
                    />
                  </div>
                  <button
                    onClick={addSellPoint}
                    disabled={!newSellPrice || !newSellPercent}
                    className="px-3 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 mb-4">
                {sellPoints.reduce((s, p) => s + p.percent, 0) < 100 && (
                  <button
                    onClick={sellRemainingPercent}
                    className="flex-1 py-2 text-sm rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  >
                    Sell Rest ({100 - sellPoints.reduce((s, p) => s + p.percent, 0)}%) @ Target
                  </button>
                )}
              </div>

              {/* Tax Calculator */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">💰 Capital Gains Tax:</span>
                  <span className="text-white font-medium">{taxRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Projected Results */}
              {sellPoints.length > 0 && (() => {
                const results = calculateExitResults();
                if (!results) return null;
                return (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <h5 className="text-purple-400 font-semibold mb-3">📊 PROJECTED RESULTS</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Gross Proceeds:</span>
                        <span className="text-white">{formatCurrency(results.grossProceeds)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cost Basis:</span>
                        <span className="text-white">{formatCurrency(results.costBasis)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Gross Profit:</span>
                        <span className="text-emerald-400">{formatCurrency(results.grossProfit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Taxes ({taxRate}%):</span>
                        <span className="text-rose-400">-{formatCurrency(results.taxes)}</span>
                      </div>
                      <div className="border-t border-purple-500/30 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-white font-semibold">NET PROFIT:</span>
                          <span className="text-emerald-400 font-bold">
                            {formatCurrency(results.netProfit)} (+{results.netProfitPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Avg Sell Price:</span>
                          <span>{formatCurrency(results.avgSellPrice)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>vs Selling All Now:</span>
                          <span className={results.vsNow >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {results.vsNow >= 0 ? '+' : ''}{formatCurrency(results.vsNow)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>vs Selling All @Target:</span>
                          <span className={results.vsTarget >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {results.vsTarget >= 0 ? '+' : ''}{formatCurrency(results.vsTarget)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Save Button */}
              {sellPoints.length > 0 && (
                <button
                  onClick={saveExitPlan}
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Exit Plan
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setForecastResult(null);
              setForecastSymbol('');
              setTargetPrice('');
              setForecastShares('');
              setSellPoints([]);
              setShowExitPlanner(false);
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

    // Check for stocks without analysis
    const stocksWithoutAnalysis = moonProjections.filter(p => !p.hasAnalysis);
    const allMissingAnalysis = stocksWithoutAnalysis.length === moonProjections.length;

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

            {/* Warning for missing analysis */}
            {stocksWithoutAnalysis.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="flex-1">
                    <p className="text-amber-400 font-medium text-sm">
                      {allMissingAnalysis
                        ? 'No AI analysis found - using default +30% targets'
                        : `${stocksWithoutAnalysis.length} stock${stocksWithoutAnalysis.length > 1 ? 's' : ''} using default +30% target`
                      }
                    </p>
                    <p className="text-amber-400/70 text-xs mt-1">
                      {stocksWithoutAnalysis.map(p => p.symbol).join(', ')}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                      Run "Scope" on these stocks for accurate bull case targets
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{p.symbol}</span>
                      {!p.hasAnalysis && (
                        <span className="text-amber-400/60 text-xs" title="Using default +30%">*</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">${p.currentPrice.toFixed(0)} → </span>
                      <span className={p.hasAnalysis ? 'text-emerald-400' : 'text-emerald-400/60'}>${p.targetPrice.toFixed(0)}</span>
                      <span className={`text-sm ml-2 ${p.hasAnalysis ? 'text-emerald-400/70' : 'text-emerald-400/50'}`}>(+{p.changePercent.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
              {stocksWithoutAnalysis.length > 0 && (
                <p className="text-slate-600 text-xs mt-3">* Using default +30% target</p>
              )}
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

    // Check for stocks without analysis
    const stocksWithoutAnalysis = doomProjections.filter(p => !p.hasAnalysis);
    const allMissingAnalysis = stocksWithoutAnalysis.length === doomProjections.length;

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

            {/* Warning for missing analysis */}
            {stocksWithoutAnalysis.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="flex-1">
                    <p className="text-amber-400 font-medium text-sm">
                      {allMissingAnalysis
                        ? 'No AI analysis found - using default -30% targets'
                        : `${stocksWithoutAnalysis.length} stock${stocksWithoutAnalysis.length > 1 ? 's' : ''} using default -30% target`
                      }
                    </p>
                    <p className="text-amber-400/70 text-xs mt-1">
                      {stocksWithoutAnalysis.map(p => p.symbol).join(', ')}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                      Run "Scope" on these stocks for accurate bear case targets
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{p.symbol}</span>
                      {!p.hasAnalysis && (
                        <span className="text-amber-400/60 text-xs" title="Using default -30%">*</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">${p.currentPrice.toFixed(0)} → </span>
                      <span className={p.hasAnalysis ? 'text-rose-400' : 'text-rose-400/60'}>${p.targetPrice.toFixed(0)}</span>
                      <span className={`text-sm ml-2 ${p.hasAnalysis ? 'text-rose-400/70' : 'text-rose-400/50'}`}>({p.changePercent.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
              {stocksWithoutAnalysis.length > 0 && (
                <p className="text-slate-600 text-xs mt-3">* Using default -30% target</p>
              )}
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

      {/* Dream Archive Modal */}
      {showDreamArchive && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-violet-400" />
                Dream Archive
              </h2>
              <button
                onClick={() => setShowDreamArchive(false)}
                className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Dreams List */}
            <div className="space-y-3">
              {savedDreams.map((dream) => (
                <button
                  key={dream.id}
                  onClick={() => {
                    setSelectedDream(dream);
                    setShowDreamArchive(false);
                  }}
                  className="w-full bg-slate-900/70 border border-slate-800/50 rounded-xl p-4 text-left hover:bg-slate-800/50 hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {dream.type === 'backtest' ? '⏪' : dream.type === 'forecast' ? '🎯' : dream.type === 'moon' ? '🚀' : '💀'}
                        </span>
                        <p className="text-white font-medium truncate">{dream.title}</p>
                      </div>
                      <p className="text-slate-400 text-sm">{dream.summary}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(dream.timestamp)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Clear All Button */}
            {savedDreams.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Delete all saved dreams?')) {
                    setSavedDreams([]);
                    localStorage.removeItem(DREAMS_STORAGE_KEY);
                    setShowDreamArchive(false);
                  }
                }}
                className="w-full mt-6 py-3 text-rose-400 text-sm flex items-center justify-center gap-2 hover:bg-rose-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Dreams
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Dream Detail Modal */}
      {selectedDream && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {selectedDream.type === 'backtest' ? '⏪' : selectedDream.type === 'forecast' ? '🎯' : selectedDream.type === 'moon' ? '🚀' : '💀'}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedDream.title}</h2>
                  <p className="text-slate-400 text-sm">{formatDate(selectedDream.timestamp)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDream(null)}
                className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Dream Content */}
            <div className="bg-slate-900/70 border border-slate-800/50 rounded-xl p-4">
              <p className="text-slate-300 mb-4">{selectedDream.summary}</p>

              {/* Backtest Result */}
              {selectedDream.type === 'backtest' && (
                <div className="space-y-3">
                  {(() => {
                    const data = selectedDream.data as BacktestResult;
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Symbol</span>
                          <span className="text-white font-medium">{data.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Investment</span>
                          <span className="text-white">${data.investmentAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Purchase Price</span>
                          <span className="text-white">${data.purchasePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Value</span>
                          <span className={data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            ${data.currentValue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-800">
                          <span className="text-slate-400">Total Return</span>
                          <span className={data.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {data.profit >= 0 ? '+' : ''}{data.profitPercent.toFixed(1)}%
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Forecast Result */}
              {selectedDream.type === 'forecast' && (
                <div className="space-y-3">
                  {(() => {
                    const data = selectedDream.data as ForecastResult;
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Symbol</span>
                          <span className="text-white font-medium">{data.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Price</span>
                          <span className="text-white">${data.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Price</span>
                          <span className="text-violet-400">${data.targetPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-800">
                          <span className="text-slate-400">Potential Gain</span>
                          <span className="text-emerald-400 font-bold">
                            +${data.potentialProfit.toLocaleString()}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Moon/Doom Projections */}
              {(selectedDream.type === 'moon' || selectedDream.type === 'doom') && (
                <div className="space-y-3">
                  {(() => {
                    const projections = selectedDream.data as PortfolioProjection[];
                    const totalCurrent = projections.reduce((s, p) => s + p.currentValue, 0);
                    const totalTarget = projections.reduce((s, p) => s + p.targetValue, 0);
                    const totalChange = totalTarget - totalCurrent;

                    return (
                      <>
                        {projections.map((p) => (
                          <div key={p.symbol} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                            <div>
                              <span className="text-white font-medium">{p.symbol}</span>
                              <span className="text-slate-500 text-sm ml-2">{p.shares} shares</span>
                            </div>
                            <div className="text-right">
                              <p className={p.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                ${p.targetValue.toLocaleString()}
                              </p>
                              <p className={`text-xs ${p.change >= 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>
                                {p.change >= 0 ? '+' : ''}{p.changePercent.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between pt-3 border-t border-slate-700">
                          <span className="text-white font-bold">Total Portfolio</span>
                          <div className="text-right">
                            <p className={totalChange >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              ${totalTarget.toLocaleString()}
                            </p>
                            <p className={`text-xs ${totalChange >= 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>
                              {totalChange >= 0 ? '+' : ''}${totalChange.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Delete Button */}
            <button
              onClick={() => {
                const newDreams = savedDreams.filter(d => d.id !== selectedDream.id);
                setSavedDreams(newDreams);
                localStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(newDreams));
                setSelectedDream(null);
              }}
              className="w-full mt-4 py-3 text-rose-400 text-sm flex items-center justify-center gap-2 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete This Dream
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default DreamView;
