import { useState, useMemo, memo } from 'react';
import {
  TrendingUp, TrendingDown, Zap, Brain, ChevronDown,
  Sparkles, RefreshCw, AlertCircle, Clock, BarChart3, Check,
} from 'lucide-react';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Header } from '@/components/layout';
import { ScenarioCard } from '@/components/analysis';
import {
  generateChartData, mockQuickScan, mockDeepDive,
  type QuickScanMockResult, type DeepDiveMockResult,
} from '@/services/mockData';
import type { Stock } from '@/types';

type AnalysisMode = 'quick' | 'deep';
type AnalysisResult = QuickScanMockResult | DeepDiveMockResult;

interface DetailViewProps {
  stock: Stock;
  onBack: () => void;
}

/**
 * DetailView - Individual stock analysis with SpectraScope Engine
 * Shows price chart and AI-powered analysis panel
 */
export const DetailView = memo(function DetailView({
  stock,
  onBack,
}: DetailViewProps) {
  const chartData = useMemo(() => generateChartData(stock.price), [stock.price]);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('deep');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const result = analysisMode === 'quick'
        ? await mockQuickScan(stock.symbol)
        : await mockDeepDive(stock.symbol);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const isPositive = stock.change >= 0;

  return (
    <div className="min-h-screen bg-black pb-24">
      <Header
        title={stock.symbol}
        subtitle={stock.name}
        badge="NASDAQ"
        showBack
        onBack={onBack}
      />

      {/* Price Display */}
      <PriceDisplay stock={stock} />

      {/* Main Chart */}
      <PriceChart chartData={chartData} isPositive={isPositive} />

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
          <AnalysisControls
            analysisMode={analysisMode}
            showModeDropdown={showModeDropdown}
            isAnalyzing={isAnalyzing}
            onModeSelect={(mode) => { setAnalysisMode(mode); setShowModeDropdown(false); }}
            onToggleDropdown={() => setShowModeDropdown(!showModeDropdown)}
            onAnalyze={runAnalysis}
          />

          {/* Analysis Results */}
          <AnalysisResults
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            analysisMode={analysisMode}
            expandedCard={expandedCard}
            onToggleCard={(card) => setExpandedCard(expandedCard === card ? null : card)}
          />
        </div>
      </div>

      {/* Key Stats */}
      <KeyStats />
    </div>
  );
});

// Price Display Component
const PriceDisplay = memo(function PriceDisplay({ stock }: { stock: Stock }) {
  const isPositive = stock.change >= 0;
  return (
    <div className="px-5 py-6">
      <div className="flex items-end gap-4">
        <span className="text-5xl font-bold text-white tracking-tight">
          ${stock.price.toFixed(2)}
        </span>
        <div className={`flex items-center gap-2 pb-2 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          <span className="text-xl font-semibold">
            {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
      <p className="text-slate-500 text-sm mt-2">Today</p>
    </div>
  );
});

// Price Chart Component
interface PriceChartProps {
  chartData: ReturnType<typeof generateChartData>;
  isPositive: boolean;
}

const PriceChart = memo(function PriceChart({ chartData, isPositive }: PriceChartProps) {
  return (
    <div className="px-5 mb-6">
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis yAxisId="price" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} orientation="right" />
              <YAxis yAxisId="volume" orientation="left" hide />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="price" stroke={isPositive ? '#10b981' : '#f43f5e'} strokeWidth={2} fill="url(#priceGradient)" yAxisId="price" />
              <Bar dataKey="volume" fill="#3b82f6" opacity={0.2} yAxisId="volume" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <TimeRangeSelector />
      </div>
    </div>
  );
});

// Time Range Selector
const TimeRangeSelector = memo(function TimeRangeSelector() {
  const ranges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  return (
    <div className="flex gap-2 mt-4 justify-center">
      {ranges.map((range, i) => (
        <button
          key={range}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            i === 2 ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
});

// Analysis Controls
interface AnalysisControlsProps {
  analysisMode: AnalysisMode;
  showModeDropdown: boolean;
  isAnalyzing: boolean;
  onModeSelect: (mode: AnalysisMode) => void;
  onToggleDropdown: () => void;
  onAnalyze: () => void;
}

const AnalysisControls = memo(function AnalysisControls({ analysisMode, showModeDropdown, isAnalyzing, onModeSelect, onToggleDropdown, onAnalyze }: AnalysisControlsProps) {
  return (
    <div className="p-5">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <button onClick={onToggleDropdown} className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white transition-all hover:bg-slate-700/50">
            <div className="flex items-center gap-3">
              {analysisMode === 'quick' ? <Zap size={18} className="text-amber-400" /> : <Brain size={18} className="text-purple-400" />}
              <span className="font-medium">{analysisMode === 'quick' ? 'Quick Scan' : 'Deep Dive'}</span>
              <span className="text-slate-500 text-sm">{analysisMode === 'quick' ? 'Low Cost' : 'High Cost'}</span>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showModeDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-10">
              {[{ mode: 'quick' as const, icon: Zap, color: 'text-amber-400', label: 'Quick Scan', desc: 'Technical indicators only • ~2s' },
                { mode: 'deep' as const, icon: Brain, color: 'text-purple-400', label: 'Deep Dive', desc: 'Full AI analysis + 3 scenarios • ~4s' }].map(({ mode, icon: Icon, color, label, desc }) => (
                <button key={mode} onClick={() => onModeSelect(mode)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors">
                  <Icon size={18} className={color} />
                  <div className="text-left flex-1"><p className="text-white font-medium">{label}</p><p className="text-slate-500 text-xs">{desc}</p></div>
                  {analysisMode === mode && <Check size={18} className="text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onAnalyze} disabled={isAnalyzing} className={`btn-primary flex items-center gap-2 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {isAnalyzing ? <><RefreshCw size={18} className="animate-spin" /><span>Analyzing...</span></> : <><Sparkles size={18} /><span>Analyze Now</span></>}
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3 text-slate-500 text-xs">
        <AlertCircle size={14} />
        <span>{analysisMode === 'quick' ? 'Quick Scan uses minimal API credits' : 'Deep Dive uses AI tokens for comprehensive analysis'}</span>
      </div>
    </div>
  );
});

// Analysis Results
interface AnalysisResultsProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  analysisMode: AnalysisMode;
  expandedCard: string | null;
  onToggleCard: (card: string) => void;
}

const AnalysisResults = memo(function AnalysisResults({ analysis, isAnalyzing, analysisMode, expandedCard, onToggleCard }: AnalysisResultsProps) {
  if (isAnalyzing) {
    return (
      <div className="px-5 pb-5">
        <div className="bg-slate-800/30 rounded-xl p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center"><Brain size={24} className="text-blue-400" /></div>
            </div>
            <p className="text-white font-medium mt-4">{analysisMode === 'quick' ? 'Running technical analysis...' : 'Generating AI scenarios...'}</p>
            <p className="text-slate-500 text-sm mt-1">{analysisMode === 'quick' ? 'Analyzing RSI, MACD, Moving Averages' : 'Parsing news, sentiment & options flow'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (analysis?.type === 'quick') {
    return (
      <div className="px-5 pb-5">
        <div className="bg-slate-800/30 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-amber-400" />Technical Summary</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[{ label: 'RSI (14)', value: analysis.technicals.rsi, color: analysis.technicals.rsi > 70 ? 'text-rose-400' : analysis.technicals.rsi < 30 ? 'text-emerald-400' : 'text-slate-200' },
              { label: 'MACD', value: analysis.technicals.macd.toFixed(2), color: analysis.technicals.macd > 0 ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'Volume', value: analysis.technicals.volume, color: 'text-slate-200' }].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-900/50 rounded-xl p-3"><span className="text-slate-500 text-xs">{label}</span><p className={`text-xl font-bold capitalize ${color}`}>{value}</p></div>
            ))}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
        </div>
      </div>
    );
  }

  if (analysis?.type === 'deep') {
    return (
      <div className="px-5 pb-5 space-y-4">
        <div className="flex gap-3 mb-2">
          {[{ label: 'News Sentiment', value: analysis.sentiment.news },
            { label: 'Social Sentiment', value: analysis.sentiment.social },
            { label: 'Options Flow', value: analysis.sentiment.options }].map(({ label, value }) => (
            <div key={label} className="flex-1 bg-slate-800/30 rounded-xl px-4 py-3">
              <span className="text-slate-500 text-xs">{label}</span>
              <p className={`font-semibold capitalize ${['positive', 'bullish', 'call-heavy'].includes(value) ? 'text-emerald-400' : 'text-slate-300'}`}>{value}</p>
            </div>
          ))}
        </div>
        <ScenarioCard type="bull" data={analysis.scenarios.bull} expanded={expandedCard === 'bull'} onToggle={() => onToggleCard('bull')} />
        <ScenarioCard type="base" data={analysis.scenarios.base} expanded={expandedCard === 'base'} onToggle={() => onToggleCard('base')} />
        <ScenarioCard type="bear" data={analysis.scenarios.bear} expanded={expandedCard === 'bear'} onToggle={() => onToggleCard('bear')} />
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      <div className="bg-slate-800/20 border border-dashed border-slate-700/50 rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center"><Sparkles size={28} className="text-slate-600" /></div>
        <p className="text-slate-400 font-medium">No Analysis Data</p>
        <p className="text-slate-600 text-sm mt-1">Click "Analyze Now" to generate insights</p>
      </div>
    </div>
  );
});

// Key Stats
const KeyStats = memo(function KeyStats() {
  const stats = [
    { label: 'Market Cap', value: '$792.4B' }, { label: 'P/E Ratio', value: '48.32' },
    { label: 'Volume', value: '45.2M' }, { label: 'Avg Volume', value: '52.1M' },
    { label: '52W High', value: '$299.29' }, { label: '52W Low', value: '$152.37' },
  ];
  return (
    <div className="px-5 mb-6">
      <h3 className="text-white font-semibold mb-3">Key Statistics</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-900/30 border border-slate-800/50 rounded-xl px-4 py-3">
            <span className="text-slate-500 text-xs">{stat.label}</span>
            <p className="text-white font-semibold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export default DetailView;
