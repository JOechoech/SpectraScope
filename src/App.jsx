import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, CartesianGrid
} from 'recharts';
import {
  TrendingUp, TrendingDown, Settings, ChevronLeft, Search, Zap, Brain,
  Shield, Key, Eye, EyeOff, Check, AlertCircle, RefreshCw, Sparkles,
  BarChart3, Activity, Clock, ChevronDown, Moon, Sun, ExternalLink
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA SERVICE - Simulates API responses with realistic delay
// ═══════════════════════════════════════════════════════════════════════════════

const MockDataService = {
  // Watchlist data
  watchlist: [
    { symbol: 'TSLA', name: 'Tesla Inc', price: 248.50, change: 12.35, changePercent: 5.23, sparkline: [220, 225, 218, 230, 235, 228, 242, 248] },
    { symbol: 'NVDA', name: 'NVIDIA Corp', price: 875.28, change: -18.42, changePercent: -2.06, sparkline: [920, 915, 900, 890, 885, 870, 880, 875] },
    { symbol: 'AAPL', name: 'Apple Inc', price: 189.84, change: 2.15, changePercent: 1.15, sparkline: [185, 186, 188, 187, 189, 188, 190, 189] },
    { symbol: 'MSFT', name: 'Microsoft Corp', price: 378.91, change: 4.67, changePercent: 1.25, sparkline: [370, 372, 375, 373, 376, 378, 377, 378] },
    { symbol: 'META', name: 'Meta Platforms', price: 485.22, change: -8.33, changePercent: -1.69, sparkline: [500, 498, 492, 488, 490, 485, 487, 485] },
    { symbol: 'AMZN', name: 'Amazon.com', price: 178.25, change: 3.42, changePercent: 1.96, sparkline: [172, 174, 175, 176, 177, 175, 178, 178] },
  ],

  // Generate detailed chart data
  generateChartData: (basePrice, days = 30) => {
    const data = [];
    let price = basePrice * 0.9;
    for (let i = 0; i < days; i++) {
      const volatility = (Math.random() - 0.5) * 8;
      const open = price;
      const close = price + volatility;
      const high = Math.max(open, close) + Math.random() * 3;
      const low = Math.min(open, close) - Math.random() * 3;
      const volume = Math.floor(Math.random() * 50000000) + 10000000;
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        open: +open.toFixed(2),
        close: +close.toFixed(2),
        high: +high.toFixed(2),
        low: +low.toFixed(2),
        volume,
        price: +close.toFixed(2)
      });
      price = close;
    }
    return data;
  },

  // Quick Scan Analysis (Technical indicators only)
  quickScan: async (symbol) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      timestamp: new Date().toISOString(),
      type: 'quick',
      technicals: {
        rsi: Math.floor(Math.random() * 40) + 30,
        macd: (Math.random() - 0.5) * 2,
        sma20: Math.random() > 0.5 ? 'above' : 'below',
        sma50: Math.random() > 0.5 ? 'above' : 'below',
        volume: Math.random() > 0.5 ? 'high' : 'normal',
        volatility: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)]
      },
      summary: `Technical analysis shows ${symbol} is trading ${Math.random() > 0.5 ? 'above' : 'below'} key moving averages with ${['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)]} momentum indicators.`
    };
  },

  // Deep Dive Analysis (Full AI-powered scenarios)
  deepDive: async (symbol) => {
    await new Promise(resolve => setTimeout(resolve, 3500));
    const bullProb = Math.floor(Math.random() * 25) + 20;
    const bearProb = Math.floor(Math.random() * 25) + 15;
    const middleProb = 100 - bullProb - bearProb;
    
    return {
      timestamp: new Date().toISOString(),
      type: 'deep',
      scenarios: {
        bull: {
          probability: bullProb,
          priceTarget: '+18-25%',
          timeframe: '6-12 months',
          title: 'Optimistic Scenario',
          summary: `Strong institutional buying pressure combined with positive earnings momentum could drive ${symbol} to new highs. Key catalysts include expanding margins, market share gains, and favorable macro conditions.`,
          catalysts: ['Earnings beat expectations', 'New product launches', 'Market expansion', 'Favorable regulations']
        },
        bear: {
          probability: bearProb,
          priceTarget: '-15-22%',
          timeframe: '3-6 months',
          title: 'Pessimistic Scenario',
          summary: `Downside risks include deteriorating fundamentals, increased competition, and broader market correction. Watch for insider selling and declining institutional interest.`,
          catalysts: ['Revenue miss', 'Margin compression', 'Competitive pressure', 'Macro headwinds']
        },
        middle: {
          probability: middleProb,
          priceTarget: '+2-8%',
          timeframe: '12 months',
          title: 'Base Case',
          summary: `Most likely scenario sees ${symbol} trading in a range with gradual appreciation aligned with sector performance. Balanced risk/reward profile suitable for long-term holders.`,
          catalysts: ['Steady growth', 'Market consensus', 'Sector rotation', 'Dividend stability']
        }
      },
      sentiment: {
        news: Math.random() > 0.5 ? 'positive' : 'neutral',
        social: Math.random() > 0.5 ? 'bullish' : 'mixed',
        options: Math.random() > 0.5 ? 'call-heavy' : 'balanced'
      }
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPARKLINE COMPONENT - Mini chart for watchlist
// ═══════════════════════════════════════════════════════════════════════════════

const Sparkline = ({ data, positive }) => {
  const chartData = data.map((value, i) => ({ value, index: i }));
  const color = positive ? '#10b981' : '#f43f5e';
  
  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`spark-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${positive ? 'up' : 'down'})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO CARD COMPONENT - Bull/Bear/Middle case display
// ═══════════════════════════════════════════════════════════════════════════════

const ScenarioCard = ({ type, data, expanded, onToggle }) => {
  const configs = {
    bull: {
      gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400',
      ring: 'ring-emerald-500/30'
    },
    bear: {
      gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
      border: 'border-rose-500/30',
      glow: 'shadow-rose-500/20',
      icon: TrendingDown,
      iconColor: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-400',
      ring: 'ring-rose-500/30'
    },
    middle: {
      gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/20',
      icon: Activity,
      iconColor: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-400',
      ring: 'ring-blue-500/30'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div
      onClick={onToggle}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer
        bg-gradient-to-br ${config.gradient}
        border ${config.border}
        backdrop-blur-xl
        shadow-lg ${config.glow}
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:shadow-xl
        ${expanded ? `ring-2 ${config.ring}` : ''}
      `}
    >
      {/* Animated glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-50 animate-pulse`} />
      
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-slate-900/50 ${config.iconColor}`}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm tracking-wide">{data.title}</h3>
              <p className="text-slate-400 text-xs">{data.timeframe}</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-full ${config.badge} text-sm font-bold`}>
            {data.probability}%
          </div>
        </div>

        {/* Price Target */}
        <div className="mb-4">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Price Target</span>
          <p className={`text-2xl font-bold ${config.iconColor} mt-1`}>{data.priceTarget}</p>
        </div>

        {/* Summary */}
        <p className={`text-slate-300 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {data.summary}
        </p>

        {/* Catalysts (expanded view) */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <span className="text-slate-500 text-xs uppercase tracking-wider">Key Catalysts</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.catalysts.map((catalyst, i) => (
                <span key={i} className="px-2 py-1 bg-slate-800/50 rounded-lg text-xs text-slate-300">
                  {catalyst}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expand indicator */}
        <div className="flex justify-center mt-4">
          <ChevronDown 
            size={16} 
            className={`text-slate-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WATCHLIST VIEW - Home screen showing tracked stocks
// ═══════════════════════════════════════════════════════════════════════════════

const WatchlistView = ({ onSelectStock, onOpenSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const stocks = MockDataService.watchlist;
  
  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Watchlist</h1>
              <p className="text-slate-500 text-sm mt-1">Track your investments</p>
            </div>
            <button 
              onClick={onOpenSettings}
              className="p-3 rounded-full bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
            >
              <Settings size={22} className="text-slate-400" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Stock List */}
      <div className="px-5 py-4 space-y-3 pb-24">
        {filteredStocks.map((stock, index) => (
          <button
            key={stock.symbol}
            onClick={() => onSelectStock(stock)}
            className="w-full p-4 bg-slate-900/30 hover:bg-slate-800/40 border border-slate-800/50 rounded-2xl transition-all duration-300 hover:scale-[1.01] group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{stock.symbol.slice(0, 2)}</span>
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">
                    {stock.symbol}
                  </h3>
                  <p className="text-slate-500 text-sm">{stock.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Sparkline data={stock.sparkline} positive={stock.change >= 0} />
                <div className="text-right min-w-[100px]">
                  <p className="text-white font-semibold text-lg">${stock.price.toFixed(2)}</p>
                  <p className={`text-sm font-medium flex items-center justify-end gap-1 ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Market Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/50 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">Market Open</span>
          </div>
          <span className="text-slate-500 text-sm">Last updated: just now</span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL VIEW - Individual stock analysis with SpectraScope Engine
// ═══════════════════════════════════════════════════════════════════════════════

const DetailView = ({ stock, onBack }) => {
  const [chartData] = useState(() => MockDataService.generateChartData(stock.price));
  const [analysisMode, setAnalysisMode] = useState('deep');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    
    try {
      const result = analysisMode === 'quick' 
        ? await MockDataService.quickScan(stock.symbol)
        : await MockDataService.deepDive(stock.symbol);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-slate-800/50 transition-colors"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{stock.symbol}</h1>
                <span className="px-2 py-0.5 bg-slate-800 rounded-lg text-slate-400 text-xs">
                  NASDAQ
                </span>
              </div>
              <p className="text-slate-500 text-sm">{stock.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price Display */}
      <div className="px-5 py-6">
        <div className="flex items-end gap-4">
          <span className="text-5xl font-bold text-white tracking-tight">
            ${stock.price.toFixed(2)}
          </span>
          <div className={`flex items-center gap-2 pb-2 ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stock.change >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span className="text-xl font-semibold">
              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <p className="text-slate-500 text-sm mt-2">Today</p>
      </div>

      {/* Main Chart */}
      <div className="px-5 mb-6">
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stock.change >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={stock.change >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="price"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  orientation="right"
                />
                <YAxis
                  yAxisId="volume"
                  orientation="left"
                  hide={true}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={stock.change >= 0 ? '#10b981' : '#f43f5e'}
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  yAxisId="price"
                />
                <Bar dataKey="volume" fill="#3b82f6" opacity={0.2} yAxisId="volume" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2 mt-4 justify-center">
            {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((range, i) => (
              <button
                key={range}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  i === 2 
                    ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SpectraScope Engine Section */}
      <div className="px-5 mb-6">
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/50 rounded-2xl overflow-hidden">
          {/* Engine Header */}
          <div className="p-5 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <Sparkles size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">SpectraScope Engine</h2>
                  <p className="text-slate-500 text-sm">AI-Powered Analysis</p>
                </div>
              </div>
              
              {analysis && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Clock size={14} />
                  <span>Last: {formatTime(analysis.timestamp)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Controls */}
          <div className="p-5">
            <div className="flex gap-3">
              {/* Mode Selector Dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white transition-all hover:bg-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    {analysisMode === 'quick' ? (
                      <>
                        <Zap size={18} className="text-amber-400" />
                        <div className="text-left">
                          <span className="font-medium">Quick Scan</span>
                          <span className="text-slate-500 text-sm ml-2">Low Cost</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Brain size={18} className="text-purple-400" />
                        <div className="text-left">
                          <span className="font-medium">Deep Dive</span>
                          <span className="text-slate-500 text-sm ml-2">High Cost</span>
                        </div>
                      </>
                    )}
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showModeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-10">
                    <button
                      onClick={() => { setAnalysisMode('quick'); setShowModeDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors"
                    >
                      <Zap size={18} className="text-amber-400" />
                      <div className="text-left flex-1">
                        <p className="text-white font-medium">Quick Scan</p>
                        <p className="text-slate-500 text-xs">Technical indicators only • ~2s</p>
                      </div>
                      {analysisMode === 'quick' && <Check size={18} className="text-emerald-400" />}
                    </button>
                    <button
                      onClick={() => { setAnalysisMode('deep'); setShowModeDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors"
                    >
                      <Brain size={18} className="text-purple-400" />
                      <div className="text-left flex-1">
                        <p className="text-white font-medium">Deep Dive</p>
                        <p className="text-slate-500 text-xs">Full AI analysis + 3 scenarios • ~4s</p>
                      </div>
                      {analysisMode === 'deep' && <Check size={18} className="text-emerald-400" />}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Analyze Button */}
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className={`
                  px-6 py-3 rounded-xl font-semibold text-white
                  flex items-center gap-2 transition-all duration-300
                  ${isAnalyzing 
                    ? 'bg-slate-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105'
                  }
                `}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Analyze Now</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Cost Warning */}
            <div className="flex items-center gap-2 mt-3 text-slate-500 text-xs">
              <AlertCircle size={14} />
              <span>
                {analysisMode === 'quick' 
                  ? 'Quick Scan uses minimal API credits'
                  : 'Deep Dive uses AI tokens for comprehensive analysis'
                }
              </span>
            </div>
          </div>

          {/* Analysis Results */}
          {isAnalyzing && (
            <div className="px-5 pb-5">
              <div className="bg-slate-800/30 rounded-xl p-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain size={24} className="text-blue-400" />
                    </div>
                  </div>
                  <p className="text-white font-medium mt-4">
                    {analysisMode === 'quick' ? 'Running technical analysis...' : 'Generating AI scenarios...'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {analysisMode === 'quick' ? 'Analyzing RSI, MACD, Moving Averages' : 'Parsing news, sentiment & options flow'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Scan Results */}
          {analysis && analysis.type === 'quick' && (
            <div className="px-5 pb-5">
              <div className="bg-slate-800/30 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-amber-400" />
                  Technical Summary
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-900/50 rounded-xl p-3">
                    <span className="text-slate-500 text-xs">RSI (14)</span>
                    <p className={`text-xl font-bold ${
                      analysis.technicals.rsi > 70 ? 'text-rose-400' : 
                      analysis.technicals.rsi < 30 ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {analysis.technicals.rsi}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-3">
                    <span className="text-slate-500 text-xs">MACD</span>
                    <p className={`text-xl font-bold ${
                      analysis.technicals.macd > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {analysis.technicals.macd.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-3">
                    <span className="text-slate-500 text-xs">Volume</span>
                    <p className="text-xl font-bold text-slate-200 capitalize">
                      {analysis.technicals.volume}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    analysis.technicals.sma20 === 'above' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {analysis.technicals.sma20 === 'above' ? '↑' : '↓'} SMA20
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    analysis.technicals.sma50 === 'above' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {analysis.technicals.sma50 === 'above' ? '↑' : '↓'} SMA50
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 capitalize">
                    {analysis.technicals.volatility} Volatility
                  </span>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
              </div>
            </div>
          )}

          {/* Deep Dive Results - 3 Scenario Cards */}
          {analysis && analysis.type === 'deep' && (
            <div className="px-5 pb-5 space-y-4">
              {/* Sentiment Overview */}
              <div className="flex gap-3 mb-2">
                <div className="flex-1 bg-slate-800/30 rounded-xl px-4 py-3">
                  <span className="text-slate-500 text-xs">News Sentiment</span>
                  <p className={`font-semibold capitalize ${
                    analysis.sentiment.news === 'positive' ? 'text-emerald-400' : 'text-slate-300'
                  }`}>{analysis.sentiment.news}</p>
                </div>
                <div className="flex-1 bg-slate-800/30 rounded-xl px-4 py-3">
                  <span className="text-slate-500 text-xs">Social Sentiment</span>
                  <p className={`font-semibold capitalize ${
                    analysis.sentiment.social === 'bullish' ? 'text-emerald-400' : 'text-slate-300'
                  }`}>{analysis.sentiment.social}</p>
                </div>
                <div className="flex-1 bg-slate-800/30 rounded-xl px-4 py-3">
                  <span className="text-slate-500 text-xs">Options Flow</span>
                  <p className={`font-semibold capitalize ${
                    analysis.sentiment.options === 'call-heavy' ? 'text-emerald-400' : 'text-slate-300'
                  }`}>{analysis.sentiment.options}</p>
                </div>
              </div>

              {/* Scenario Cards */}
              <ScenarioCard
                type="bull"
                data={analysis.scenarios.bull}
                expanded={expandedCard === 'bull'}
                onToggle={() => setExpandedCard(expandedCard === 'bull' ? null : 'bull')}
              />
              <ScenarioCard
                type="middle"
                data={analysis.scenarios.middle}
                expanded={expandedCard === 'middle'}
                onToggle={() => setExpandedCard(expandedCard === 'middle' ? null : 'middle')}
              />
              <ScenarioCard
                type="bear"
                data={analysis.scenarios.bear}
                expanded={expandedCard === 'bear'}
                onToggle={() => setExpandedCard(expandedCard === 'bear' ? null : 'bear')}
              />
            </div>
          )}

          {/* Empty State */}
          {!analysis && !isAnalyzing && (
            <div className="px-5 pb-5">
              <div className="bg-slate-800/20 border border-dashed border-slate-700/50 rounded-xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <Sparkles size={28} className="text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium">No Analysis Data</p>
                <p className="text-slate-600 text-sm mt-1">
                  Click "Analyze Now" to generate insights
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Stats */}
      <div className="px-5 mb-6">
        <h3 className="text-white font-semibold mb-3">Key Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Market Cap', value: '$792.4B' },
            { label: 'P/E Ratio', value: '48.32' },
            { label: 'Volume', value: '45.2M' },
            { label: 'Avg Volume', value: '52.1M' },
            { label: '52W High', value: '$299.29' },
            { label: '52W Low', value: '$152.37' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/30 border border-slate-800/50 rounded-xl px-4 py-3">
              <span className="text-slate-500 text-xs">{stat.label}</span>
              <p className="text-white font-semibold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS VIEW - API Key Management & Preferences
// ═══════════════════════════════════════════════════════════════════════════════

const SettingsView = ({ onBack }) => {
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    financial: '',
    twitter: ''
  });
  const [showKeys, setShowKeys] = useState({});
  const [saved, setSaved] = useState({});
  const [darkMode, setDarkMode] = useState(true);

  const handleSave = (key) => {
    setSaved({ ...saved, [key]: true });
    setTimeout(() => setSaved({ ...saved, [key]: false }), 2000);
  };

  const apiKeyFields = [
    {
      key: 'openai',
      label: 'OpenAI API Key',
      description: 'Powers the AI reasoning engine for scenario generation',
      icon: Brain,
      placeholder: 'sk-...'
    },
    {
      key: 'anthropic',
      label: 'Anthropic API Key',
      description: 'Alternative AI provider for analysis',
      icon: Sparkles,
      placeholder: 'sk-ant-...'
    },
    {
      key: 'financial',
      label: 'Financial Data API Key',
      description: 'AlphaVantage, Polygon, or similar for market data',
      icon: BarChart3,
      placeholder: 'Your API key'
    },
    {
      key: 'twitter',
      label: 'Twitter/X API Key (Optional)',
      description: 'For social sentiment analysis',
      icon: Activity,
      placeholder: 'Optional'
    }
  ];

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-slate-800/50 transition-colors"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-slate-500 text-sm">Control Room</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Key size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">API Key Management</h2>
            <p className="text-slate-500 text-sm">Stored locally in your browser</p>
          </div>
        </div>

        <div className="space-y-4">
          {apiKeyFields.map((field) => (
            <div key={field.key} className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-xl bg-slate-800/50">
                  <field.icon size={18} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{field.label}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{field.description}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys[field.key] ? 'text' : 'password'}
                    value={apiKeys[field.key]}
                    onChange={(e) => setApiKeys({ ...apiKeys, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all pr-12"
                  />
                  <button
                    onClick={() => setShowKeys({ ...showKeys, [field.key]: !showKeys[field.key] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    {showKeys[field.key] ? (
                      <EyeOff size={16} className="text-slate-500" />
                    ) : (
                      <Eye size={16} className="text-slate-500" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => handleSave(field.key)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    saved[field.key]
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                  }`}
                >
                  {saved[field.key] ? <Check size={18} /> : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Security Notice */}
        <div className="mt-4 flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Shield size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-200 text-sm font-medium">Security Notice</p>
            <p className="text-amber-200/70 text-xs mt-1">
              API keys are stored in your browser's localStorage and never sent to our servers. 
              For maximum security, use keys with limited permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="px-5 py-6 border-t border-slate-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Moon size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Appearance</h2>
            <p className="text-slate-500 text-sm">Customize the look and feel</p>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800/50">
                {darkMode ? <Moon size={18} className="text-slate-400" /> : <Sun size={18} className="text-amber-400" />}
              </div>
              <div>
                <h3 className="text-white font-medium">Dark Mode</h3>
                <p className="text-slate-500 text-xs">OLED-optimized dark theme</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-14 h-8 rounded-full transition-all duration-300 ${
                darkMode ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300 ${
                darkMode ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="px-5 py-6 border-t border-slate-800/50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles size={32} className="text-white" />
          </div>
          <h3 className="text-white font-bold text-xl">SpectraScope</h3>
          <p className="text-slate-500 text-sm mt-1">Version 1.0.0</p>
          <p className="text-slate-600 text-xs mt-4">
            AI-Powered Investment Analysis
          </p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT - Navigation & State Management
// ═══════════════════════════════════════════════════════════════════════════════

export default function SpectraScope() {
  const [view, setView] = useState('watchlist');
  const [selectedStock, setSelectedStock] = useState(null);

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setView('detail');
  };

  const handleBack = () => {
    setView('watchlist');
    setSelectedStock(null);
  };

  return (
    <div className="font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text',sans-serif] antialiased">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
      
      {view === 'watchlist' && (
        <WatchlistView 
          onSelectStock={handleSelectStock}
          onOpenSettings={() => setView('settings')}
        />
      )}
      
      {view === 'detail' && selectedStock && (
        <DetailView 
          stock={selectedStock}
          onBack={handleBack}
        />
      )}
      
      {view === 'settings' && (
        <SettingsView 
          onBack={handleBack}
        />
      )}
    </div>
  );
}
