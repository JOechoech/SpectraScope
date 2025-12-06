/**
 * DetailView - Individual stock analysis with SpectraScope Engine
 *
 * Features:
 * - Price chart with timeframe selector
 * - Technical signals panel (auto-calculated)
 * - Scope button for AI analysis
 * - Scenario cards for Bull/Base/Bear cases
 * - Source attribution for intelligence sources
 */

import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, Share2, Copy, Download, Check, Tag, Trash2, X, Archive } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { useAnalysisStore } from '@/stores/useAnalysisStore';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { PriceChart } from '@/components/charts/PriceChart';
import { ScenarioChart } from '@/components/charts/ScenarioChart';
import { TechnicalSignalsPanel } from '@/components/analysis/TechnicalSignalsPanel';
import { ScopeButton } from '@/components/analysis/ScopeButton';
import { ScenarioCard } from '@/components/analysis/ScenarioCard';
import { SourceAttribution } from '@/components/analysis/SourceAttribution';
import { AIInsightsPanel } from '@/components/analysis/AIInsightsPanel';
import { BottomLine } from '@/components/analysis/BottomLine';
import { HoldingsInput } from '@/components/portfolio/HoldingsInput';
import { WarpAnimation } from '@/components/effects/WarpAnimation';
import { AnalysisAnimation, type AnimationPhase } from '@/components/effects/AnalysisAnimation';
import type { GatherIntelligenceProgress } from '@/services/intelligence';
import { IntelligenceReport, type SourceReport, type ClaudeAssessment } from '@/components/analysis/IntelligenceReport';
import {
  getQuote,
  getDailyData,
} from '@/services/marketData';
// No mock imports - we NEVER show fake data
import { synthesizeFromIntelligence } from '@/services/ai/anthropic';
import { gatherIntelligence } from '@/services/intelligence';
import type { StockQuote, HistoricalDataPoint, Scenario } from '@/types';
import type { AnyIntelligenceReport } from '@/types/intelligence';

// Company name lookup
const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc.',
  NVDA: 'NVIDIA Corporation',
  TSLA: 'Tesla, Inc.',
  AMZN: 'Amazon.com, Inc.',
  META: 'Meta Platforms, Inc.',
  JPM: 'JPMorgan Chase & Co.',
  V: 'Visa Inc.',
  BRK: 'Berkshire Hathaway',
};

interface DetailViewProps {
  symbol: string;
  onBack: () => void;
}

type AnalysisPhase = 'idle' | 'gathering' | 'report' | 'results';

interface AnalysisResult {
  scenarios: {
    bull: Scenario;
    bear: Scenario;
    base: Scenario;
  };
  confidence: number;
  bottomLine?: string;
  availableSources: string[];
  missingSources: string[];
  intelligenceReports: AnyIntelligenceReport[];
  overallSentiment?: 'bullish' | 'bearish' | 'neutral';
  overallScore?: number;
  sourceAssessments?: ClaudeAssessment[];
  tokenUsage?: {
    input: number;
    output: number;
    cost: number;
  };
}

export const DetailView = memo(function DetailView({
  symbol,
  onBack,
}: DetailViewProps) {
  const { getApiKey } = useApiKeysStore();
  const { addAnalysis, getLatestAnalysis, getHistory, clearHistory } = useAnalysisStore();
  const { items: watchlistItems, updateStock } = useWatchlistStore();

  const polygonKey = getApiKey('polygon');
  const anthropicKey = getApiKey('anthropic');

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [priceData, setPriceData] = useState<HistoricalDataPoint[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3-phase analysis flow
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('idle');
  const [sourceReports, setSourceReports] = useState<SourceReport[]>([]);

  // Animation state
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [animationKeywords, setAnimationKeywords] = useState<string[]>([]);
  const [agentData, setAgentData] = useState<{
    grok: { keywords: string[]; progress: number };
    openai: { keywords: string[]; progress: number };
    gemini: { keywords: string[]; progress: number };
  }>({
    grok: { keywords: [], progress: 0 },
    openai: { keywords: [], progress: 0 },
    gemini: { keywords: [], progress: 0 },
  });
  const [scenarioProgress, setScenarioProgress] = useState({
    bull: 0,
    bear: 0,
    base: 0,
  });
  const useNewAnimation = true; // Use new animated flow (set to false for legacy WarpAnimation)

  // Export functionality
  const analysisRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showRemoveScopeConfirm, setShowRemoveScopeConfirm] = useState(false);
  const [showAnalysisArchive, setShowAnalysisArchive] = useState(false);

  // Get scoped info for this stock
  const watchlistItem = watchlistItems.find((w) => w.symbol === symbol);
  const scopedInfo = watchlistItem?.scopedFrom ? {
    from: watchlistItem.scopedFrom,
    at: watchlistItem.scopedAt,
    price: watchlistItem.scopedPrice,
    sentiment: watchlistItem.scopedSentiment,
    source: watchlistItem.scopedSource,
  } : null;

  const companyName =
    watchlistItems.find((w) => w.symbol === symbol)?.name ||
    COMPANY_NAMES[symbol] ||
    symbol;

  // Cached analysis timestamp for age indicator
  const [cachedTimestamp, setCachedTimestamp] = useState<string | null>(null);

  // Sector emoji mapping
  const SECTOR_EMOJIS: Record<string, string> = {
    tech: '💻', biotech: '🧬', finance: '🏦', energy: '⚡',
    healthcare: '🏥', retail: '🛒', gaming: '🎮', meme: '🚀',
  };

  // Format scoped date as DD.MM.YYYY at HH:MM
  const formatScopedDateTime = (isoDate: string): string => {
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} at ${hours}:${minutes}`;
  };

  // Get sentiment badge
  const getSentimentBadge = (sentiment?: 'bullish' | 'bearish' | 'neutral') => {
    if (!sentiment) return { text: 'Neutral', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: '⚪' };
    if (sentiment === 'bullish') return { text: 'Bullish', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '🟢' };
    if (sentiment === 'bearish') return { text: 'Bearish', color: 'text-rose-400', bg: 'bg-rose-500/20', icon: '🔴' };
    return { text: 'Neutral', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: '⚪' };
  };

  // Calculate performance since scope
  const getScopePerformance = () => {
    if (!scopedInfo?.price || scopedInfo.price === 0 || !quote?.price) return null;
    const change = quote.price - scopedInfo.price;
    const percentChange = ((change / scopedInfo.price) * 100);
    return { change, percentChange };
  };

  // Remove scope tag handler
  const handleRemoveScopeTag = () => {
    updateStock(symbol, {
      scopedFrom: undefined,
      scopedAt: undefined,
      scopedPrice: undefined,
      scopedSentiment: undefined,
      scopedSource: undefined,
    });
    setShowRemoveScopeConfirm(false);
  };

  // Get precise age indicator with color
  const getAgeIndicator = (timestamp: string): { text: string; color: string; colorClass: string } => {
    const analysisTime = new Date(timestamp).getTime();
    const now = Date.now();
    const hoursDiff = (now - analysisTime) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      return { text: 'Fresh', color: '#10b981', colorClass: 'text-emerald-400' };
    } else if (hoursDiff < 72) {
      const hours = Math.floor(hoursDiff);
      return { text: `${hours} hour${hours === 1 ? '' : 's'} old`, color: '#f59e0b', colorClass: 'text-amber-400' };
    } else {
      const days = Math.floor(hoursDiff / 24);
      return { text: `${days} day${days === 1 ? '' : 's'} old`, color: '#64748b', colorClass: 'text-slate-400' };
    }
  };

  // Calculate prediction accuracy for past analyses
  const calculatePredictionAccuracy = (entry: any, currentPrice: number) => {
    if (!entry?.result || !entry?.inputData?.price) return null;

    const priceAtAnalysis = entry.inputData.price;
    const result = entry.result;
    const scenarios = result.scenarios || result;

    if (!scenarios?.bull || !scenarios?.bear || !scenarios?.base) return null;

    // Parse price targets from scenario strings
    const parseTarget = (targetStr: string): number | null => {
      if (!targetStr) return null;
      const match = targetStr.match(/([+-]?\d+(?:\.\d+)?)/g);
      if (match && match.length > 0) {
        const lastPercent = parseFloat(match[match.length - 1]);
        return priceAtAnalysis * (1 + lastPercent / 100);
      }
      return null;
    };

    const bullTarget = parseTarget(scenarios.bull.priceTarget);
    const bearTarget = parseTarget(scenarios.bear.priceTarget);
    const baseTarget = parseTarget(scenarios.base.priceTarget);

    const actualChange = ((currentPrice - priceAtAnalysis) / priceAtAnalysis) * 100;

    // Determine which case was hit
    let verdict = 'Between cases';
    let verdictColor = 'text-blue-400';
    let verdictIcon = '📊';

    if (bullTarget && currentPrice >= bullTarget) {
      verdict = 'Bull Case Achieved!';
      verdictColor = 'text-emerald-400';
      verdictIcon = '🎯';
    } else if (bearTarget && currentPrice <= bearTarget) {
      verdict = 'Bear Case Hit';
      verdictColor = 'text-rose-400';
      verdictIcon = '📉';
    } else if (baseTarget && Math.abs(currentPrice - baseTarget) / baseTarget < 0.1) {
      verdict = 'Base Case Achieved';
      verdictColor = 'text-blue-400';
      verdictIcon = '✅';
    }

    // Time since analysis
    const daysSince = Math.floor((Date.now() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60 * 24));
    const isTooRecent = daysSince < 7;

    return {
      priceAtAnalysis,
      currentPrice,
      actualChange,
      bullTarget,
      bearTarget,
      baseTarget,
      bullProb: scenarios.bull.probability,
      bearProb: scenarios.bear.probability,
      baseProb: scenarios.base.probability,
      verdict: isTooRecent ? 'Too early to judge' : verdict,
      verdictColor: isTooRecent ? 'text-slate-400' : verdictColor,
      verdictIcon: isTooRecent ? '⏳' : verdictIcon,
      daysSince,
      isTooRecent,
    };
  };

  // Generate markdown text from analysis
  const generateMarkdown = useCallback(() => {
    if (!analysis) return '';

    const date = cachedTimestamp ? new Date(cachedTimestamp).toLocaleDateString() : new Date().toLocaleDateString();
    const { scenarios, confidence, bottomLine } = analysis;

    return `# ${symbol} - SpectraScope Analysis
**${companyName}** | Generated ${date}

## Bottom Line
${bottomLine || 'AI-powered investment analysis'}

---

## 🐂 Bull Case (${scenarios.bull.probability}%)
**${scenarios.bull.title}**
${scenarios.bull.summary}

**Price Target:** ${scenarios.bull.priceTarget}
**Timeframe:** ${scenarios.bull.timeframe}

### Catalysts
${scenarios.bull.catalysts.map(c => `- ${c}`).join('\n')}

### Risks
${scenarios.bull.risks.map(r => `- ${r}`).join('\n')}

---

## 📊 Base Case (${scenarios.base.probability}%)
**${scenarios.base.title}**
${scenarios.base.summary}

**Price Target:** ${scenarios.base.priceTarget}
**Timeframe:** ${scenarios.base.timeframe}

### Catalysts
${scenarios.base.catalysts.map(c => `- ${c}`).join('\n')}

### Risks
${scenarios.base.risks.map(r => `- ${r}`).join('\n')}

---

## 🐻 Bear Case (${scenarios.bear.probability}%)
**${scenarios.bear.title}**
${scenarios.bear.summary}

**Price Target:** ${scenarios.bear.priceTarget}
**Timeframe:** ${scenarios.bear.timeframe}

### Catalysts
${scenarios.bear.catalysts.map(c => `- ${c}`).join('\n')}

### Risks
${scenarios.bear.risks.map(r => `- ${r}`).join('\n')}

---

*🔭 Made with SpectraScope | AI-Powered Investment Intelligence*
*Confidence: ${confidence}%*
`;
  }, [analysis, symbol, companyName, cachedTimestamp]);

  // Copy analysis as markdown
  const copyAsMarkdown = useCallback(async () => {
    const markdown = generateMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [generateMarkdown]);

  // Export analysis as branded image
  const exportAsImage = useCallback(async () => {
    if (!analysisRef.current || !analysis) return;

    // Hide share menu BEFORE capturing
    setShowShareMenu(false);
    setIsExporting(true);

    // Wait for DOM to update
    await new Promise(r => setTimeout(r, 100));

    try {
      // Create a wrapper div with branding footer
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        background: #000;
        padding: 24px;
        width: 800px;
        white-space: pre-wrap;
        word-spacing: normal;
      `;

      // Clone the analysis content
      const clone = analysisRef.current.cloneNode(true) as HTMLElement;
      clone.style.cssText = 'width: 100%; background: #000; white-space: pre-wrap; word-spacing: normal;';

      // Remove any popup elements from the clone
      const popups = clone.querySelectorAll('[class*="fixed"], [class*="z-40"], [class*="z-50"]');
      popups.forEach(el => el.remove());

      wrapper.appendChild(clone);

      // Add branded footer
      const footer = document.createElement('div');
      const date = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      footer.innerHTML = `
        <div style="
          margin-top: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid #334155;
          border-radius: 12px;
          text-align: center;
        ">
          <div style="font-size: 24px; margin-bottom: 8px;">🔭</div>
          <div style="color: #fff; font-weight: bold; font-size: 14px; letter-spacing: 2px;">
            MADE WITH SPECTRASCOPE
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
            AI-Powered Investment Intelligence
          </div>
          <div style="color: #64748b; font-size: 11px; margin-top: 8px;">
            Generated ${date}
          </div>
        </div>
      `;
      wrapper.appendChild(footer);

      // Temporarily add to DOM
      document.body.appendChild(wrapper);

      // Capture with html2canvas
      const canvas = await html2canvas(wrapper, {
        scale: 1.5, // 1.5x for good quality without being too large
        backgroundColor: '#000',
        logging: false,
        useCORS: true,
      });

      // Remove wrapper from DOM
      document.body.removeChild(wrapper);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
      });

      // Try native share first (mobile)
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], `${symbol}-analysis.png`, { type: 'image/png' })] })) {
        const file = new File([blob], `${symbol}-analysis.png`, { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: `${symbol} Analysis - SpectraScope`,
          text: `AI-powered analysis for ${symbol}`,
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${symbol}-spectrascope-analysis.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      setShowShareMenu(false);
    }
  }, [analysis, symbol]);

  // Load price data on mount and check for cached analysis
  useEffect(() => {
    loadPriceData();

    // Check for existing analysis - load ANY cached analysis (users pay for these!)
    const existing = getLatestAnalysis(symbol);
    if (existing?.result) {
      // Convert existing analysis to our format
      const result = existing.result as any;
      setAnalysis({
        scenarios: result.scenarios || result,
        confidence: result.confidence || 75,
        bottomLine: result.bottomLine,
        availableSources: result.availableSources || ['technical-analysis'],
        missingSources: result.missingSources || [],
        intelligenceReports: result.intelligenceReports || [],
        overallSentiment: result.overallSentiment,
        overallScore: result.overallScore,
        sourceAssessments: result.sourceAssessments,
        tokenUsage: existing.tokenUsage ? {
          input: existing.tokenUsage.input,
          output: existing.tokenUsage.output,
          cost: existing.cost,
        } : undefined,
      });
      setCachedTimestamp(existing.timestamp);
      // Skip to results phase since we have cached data
      setAnalysisPhase('results');
    }
  }, [symbol]);

  const loadPriceData = useCallback(async () => {
    setIsLoadingPrice(true);
    setError(null);

    try {
      // Use unified marketData service (Polygon or mock)
      const [quoteResult, dailyResult] = await Promise.all([
        getQuote(symbol),
        getDailyData(symbol, 365),
      ]);
      setQuote(quoteResult.data);
      setPriceData(dailyResult.data || []);
    } catch (err) {
      setError('Failed to load price data. Add Polygon API key in Settings.');
      console.error(err);
      // NO mock fallback - show error to user instead
      setQuote(null);
      setPriceData([]);
    } finally {
      setIsLoadingPrice(false);
    }
  }, [symbol]);

  // Handle animation progress updates
  const handleAnimationProgress = useCallback((progress: GatherIntelligenceProgress) => {
    console.debug('[Animation] Progress update:', progress.phase);

    // Map intelligence phases to animation phases
    if (progress.phase === 'orchestrating') {
      setAnimationPhase('orchestrating');
      if (progress.keywords) {
        setAnimationKeywords(progress.keywords);
      }
    } else if (progress.phase === 'searching') {
      setAnimationPhase('searching');
      if (progress.agentProgress) {
        setAgentData({
          grok: progress.agentProgress.grok || { keywords: [], progress: 0 },
          openai: progress.agentProgress.openai || { keywords: [], progress: 0 },
          gemini: progress.agentProgress.gemini || { keywords: [], progress: 0 },
        });
      }
    } else if (progress.phase === 'synthesizing') {
      setAnimationPhase('synthesizing');
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!anthropicKey || !quote) return;

    setAnalysisPhase('gathering');
    setError(null);

    // Reset animation state
    setAnimationPhase('orchestrating');
    setAnimationKeywords([]);
    setAgentData({
      grok: { keywords: [], progress: 0 },
      openai: { keywords: [], progress: 0 },
      gemini: { keywords: [], progress: 0 },
    });
    setScenarioProgress({ bull: 0, bear: 0, base: 0 });

    // Track start time for minimum animation duration
    const startTime = Date.now();
    const MIN_ANIMATION_TIME = 6000; // 6 seconds for AI arrivals

    try {
      // Gather intelligence from all sources with progress callback
      const intelligence = await gatherIntelligence({
        symbol,
        companyName,
        priceData,
        currentPrice: quote.price,
        onProgress: handleAnimationProgress,
      });

      // Transition to finalizing phase for scenario generation
      setAnimationPhase('finalizing');

      // Run Claude synthesis
      const result = await synthesizeFromIntelligence(
        intelligence,
        anthropicKey
      );

      // Animate scenario progress completion
      setScenarioProgress({ bull: 100, bear: 100, base: 100 });

      // Ensure minimum animation time for better UX
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_ANIMATION_TIME) {
        await new Promise((r) => setTimeout(r, MIN_ANIMATION_TIME - elapsed));
      }

      // Mark animation complete
      setAnimationPhase('complete');

      // Build source reports for Intelligence Report
      const reports: SourceReport[] = [
        {
          id: 'technical',
          name: 'Technical Analysis',
          icon: '📊',
          delivered: true,
          summary: 'Patterns analyzed',
        },
        {
          id: 'openai',
          name: 'OpenAI News',
          icon: '🤖',
          delivered: intelligence.availableSources.includes('news-sentiment'),
          tokensUsed: intelligence.availableSources.includes('news-sentiment') ? 250 : 0,
          summary: intelligence.availableSources.includes('news-sentiment') ? 'Latest news scanned' : undefined,
          error: !intelligence.availableSources.includes('news-sentiment') ? 'No API key' : undefined,
        },
        {
          id: 'grok',
          name: 'Grok (X/Twitter)',
          icon: '𝕏',
          delivered: intelligence.availableSources.includes('social-sentiment'),
          tokensUsed: intelligence.availableSources.includes('social-sentiment') ? 480 : 0, // Estimated
          summary: intelligence.availableSources.includes('social-sentiment') ? 'Social sentiment analyzed' : undefined,
          error: !intelligence.availableSources.includes('social-sentiment') ? 'No API key' : undefined,
        },
        {
          id: 'gemini',
          name: 'Gemini (Research)',
          icon: '✦',
          delivered: intelligence.availableSources.includes('web-research'),
          tokensUsed: intelligence.availableSources.includes('web-research') ? 620 : 0, // Estimated
          summary: intelligence.availableSources.includes('web-research') ? 'Analyst data retrieved' : undefined,
          error: !intelligence.availableSources.includes('web-research') ? 'No API key' : undefined,
        },
        {
          id: 'claude',
          name: 'Claude (Synthesis)',
          icon: '🧠',
          delivered: true,
          tokensUsed: (result.tokenUsage?.input || 0) + (result.tokenUsage?.output || 0),
          summary: 'Master analysis complete',
        },
      ];

      setSourceReports(reports);

      // Build analysis result with new fields
      const analysisResult: AnalysisResult = {
        scenarios: result.scenarios,
        confidence: result.confidence || 75,
        bottomLine: result.bottomLine,
        availableSources: intelligence.availableSources,
        missingSources: intelligence.missingSources,
        intelligenceReports: intelligence.reports,
        overallSentiment: result.overallSentiment,
        overallScore: result.overallScore,
        sourceAssessments: result.sourceAssessments,
        tokenUsage: result.tokenUsage,
      };

      setAnalysis(analysisResult);

      // Save to store with full data for restoration
      addAnalysis(symbol, {
        id: crypto.randomUUID(),
        symbol,
        timestamp: new Date().toISOString(),
        type: 'deep-dive',
        inputData: {
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          technicals: {} as any,
          aggregateScore: {} as any,
          newsHeadlines: [],
        },
        result: {
          ...result,
          scenarios: result.scenarios,
          confidence: result.confidence,
          bottomLine: result.bottomLine,
          availableSources: intelligence.availableSources,
          missingSources: intelligence.missingSources,
          intelligenceReports: intelligence.reports,
          overallSentiment: result.overallSentiment,
          overallScore: result.overallScore,
          sourceAssessments: result.sourceAssessments,
        } as any,
        tokenUsage: result.tokenUsage
          ? { input: result.tokenUsage.input, output: result.tokenUsage.output, total: result.tokenUsage.input + result.tokenUsage.output }
          : { input: 0, output: 0, total: 0 },
        cost: result.tokenUsage?.cost || 0,
        dominantScenario: 'base',
      });

      // Move to report phase
      setAnalysisPhase('report');

    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Please try again.');
      setAnalysisPhase('idle');
      setAnimationPhase('idle');
    }
  }, [symbol, companyName, priceData, quote, anthropicKey, addAnalysis, handleAnimationProgress]);

  if (isLoadingPrice) {
    return <DetailViewSkeleton onBack={onBack} symbol={symbol} />;
  }

  // Calculate totals for Intelligence Report
  const totalTokens = sourceReports.reduce((sum, s) => sum + (s.tokensUsed || 0), 0);
  const estimatedCost = analysis?.tokenUsage?.cost || (totalTokens * 0.00003);

  return (
    <>
      {/* Animation Overlay - New animated flow or legacy warp animation */}
      {useNewAnimation ? (
        <AnalysisAnimation
          isActive={analysisPhase === 'gathering'}
          phase={animationPhase}
          keywords={animationKeywords}
          agentData={agentData}
          scenarioProgress={scenarioProgress}
        />
      ) : (
        <WarpAnimation isActive={analysisPhase === 'gathering'} />
      )}

      {/* Intelligence Report Overlay */}
      {analysisPhase === 'report' && analysis && (
        <IntelligenceReport
          sources={sourceReports}
          assessments={analysis.sourceAssessments || []}
          overallSentiment={analysis.overallSentiment || 'neutral'}
          overallScore={analysis.overallScore || 5}
          totalTokens={totalTokens}
          estimatedCost={estimatedCost}
          onContinue={() => setAnalysisPhase('results')}
        />
      )}

      <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-800/50">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{symbol}</h1>
          <p className="text-slate-400 text-sm">{companyName}</p>
        </div>
        <button
          onClick={loadPriceData}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/50 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* API Key Warning */}
        {!polygonKey && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-amber-400 text-sm">
              Using demo data. Add Polygon.io API key in Settings for real-time
              prices.
            </p>
          </div>
        )}

        {/* Price Chart */}
        {quote && (
          <PriceChart
            data={priceData}
            currentPrice={quote.price}
            change={quote.change}
            changePercent={quote.changePercent}
          />
        )}

        {/* Holdings Input */}
        {quote && (
          <HoldingsInput symbol={symbol} currentPrice={quote.price} />
        )}

        {/* Scoped Stock Info Section */}
        {scopedInfo && (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-violet-400" />
              Scoped Stock
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Discovered via:</span>
                <span className="text-slate-200">
                  {scopedInfo.source === 'grok' ? '𝕏 Grok Social Scan' : '🧠 Full AI Scan'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sector:</span>
                <span className="text-slate-200">
                  {SECTOR_EMOJIS[scopedInfo.from] || '📊'} {scopedInfo.from.charAt(0).toUpperCase() + scopedInfo.from.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Scoped on:</span>
                <span className="text-slate-200">
                  {scopedInfo.at ? formatScopedDateTime(scopedInfo.at) : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sentiment at scope:</span>
                <span className={`${getSentimentBadge(scopedInfo.sentiment).color} flex items-center gap-1`}>
                  {getSentimentBadge(scopedInfo.sentiment).icon} {getSentimentBadge(scopedInfo.sentiment).text}
                </span>
              </div>
            </div>

            {/* Performance Since Scope */}
            {scopedInfo.price && scopedInfo.price > 0 && quote && (
              <>
                <div className="border-t border-slate-700/50 my-3" />
                <h4 className="text-slate-300 text-sm font-medium mb-2">📊 Performance Since Scope</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Price at scope:</span>
                    <span className="text-slate-200">${scopedInfo.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current price:</span>
                    <span className="text-slate-200">${quote.price.toFixed(2)}</span>
                  </div>
                  {(() => {
                    const perf = getScopePerformance();
                    if (!perf) return null;
                    const isUp = perf.percentChange >= 0;
                    return (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Change:</span>
                        <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                          {isUp ? '📈' : '📉'} {isUp ? '+' : ''}${perf.change.toFixed(2)} ({isUp ? '+' : ''}{perf.percentChange.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

            {/* Remove Scope Tag Button */}
            <button
              onClick={() => setShowRemoveScopeConfirm(true)}
              className="mt-4 text-rose-400 text-sm flex items-center gap-1 hover:text-rose-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove Scope Tag
            </button>
          </div>
        )}

        {/* Remove Scope Tag Confirmation Modal */}
        {showRemoveScopeConfirm && scopedInfo && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">Remove Scope Tag?</h3>
                <button
                  onClick={() => setShowRemoveScopeConfirm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-slate-400 text-sm mb-4">This will remove:</p>
              <ul className="text-slate-300 text-sm space-y-1 mb-4 ml-4 list-disc">
                <li>Scope date ({scopedInfo.at ? formatScopedDateTime(scopedInfo.at) : 'Unknown'})</li>
                <li>Original sentiment ({getSentimentBadge(scopedInfo.sentiment).text})</li>
                <li>Performance tracking</li>
              </ul>
              <p className="text-slate-400 text-sm mb-4">The stock will remain in your watchlist.</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRemoveScopeConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveScopeTag}
                  className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-500 transition-colors"
                >
                  Remove Tag
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Technical Signals (Auto-loads) */}
        {quote && priceData.length > 0 && (
          <TechnicalSignalsPanel
            priceData={priceData}
            currentPrice={quote.price}
          />
        )}

        {/* News is now analyzed via OpenAI during Scope Analysis */}

        {/* Scope Button - Always show refresh option */}
        {analysisPhase === 'results' && analysis && cachedTimestamp ? (
          <div className="space-y-3">
            {(() => {
              const age = getAgeIndicator(cachedTimestamp);
              const bgColor = age.colorClass.includes('emerald')
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : age.colorClass.includes('amber')
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-500/10 border-slate-500/30';
              return (
                <div className={`p-4 ${bgColor} border rounded-xl`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={age.colorClass}>●</span>
                      <span className={`${age.colorClass} text-sm font-medium`}>
                        {age.text}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setAnalysisPhase('idle');
                        setAnalysis(null);
                        setCachedTimestamp(null);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
                    >
                      Refresh Analysis
                    </button>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    Analyses are saved forever. Refresh to get the latest data (~$0.02).
                  </p>
                </div>
              );
            })()}
          </div>
        ) : (
          <ScopeButton
            symbol={symbol}
            onAnalyze={runAnalysis}
            isLoading={analysisPhase === 'gathering'}
            estimatedCost={{ min: 0.01, max: 0.04, avg: 0.025 }}
            hasApiKey={!!anthropicKey}
            disabled={isLoadingPrice || (analysisPhase !== 'idle' && analysisPhase !== 'results')}
            lastAnalysisTime={getLatestAnalysis(symbol)?.timestamp}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <p className="text-rose-400">{error}</p>
          </div>
        )}

        {/* Analysis Results - only show when in 'results' phase */}
        {analysisPhase === 'results' && analysis && (
          <div ref={analysisRef} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">
                  {analysis.confidence}%
                </span>

                {/* Share Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <Share2 size={18} />
                  </button>

                  {showShareMenu && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowShareMenu(false)}
                      />
                      {/* Menu */}
                      <div className="absolute right-0 top-10 z-50 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                        <button
                          onClick={exportAsImage}
                          disabled={isExporting}
                          className="w-full px-4 py-3 flex items-center gap-3 text-left text-white hover:bg-slate-800 transition-colors"
                        >
                          <Download size={16} className="text-blue-400" />
                          <span className="text-sm">
                            {isExporting ? 'Exporting...' : 'Export as Image'}
                          </span>
                        </button>
                        <button
                          onClick={copyAsMarkdown}
                          className="w-full px-4 py-3 flex items-center gap-3 text-left text-white hover:bg-slate-800 transition-colors border-t border-slate-800"
                        >
                          {copied ? (
                            <Check size={16} className="text-emerald-400" />
                          ) : (
                            <Copy size={16} className="text-slate-400" />
                          )}
                          <span className="text-sm">
                            {copied ? 'Copied!' : 'Copy as Markdown'}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Line Summary - FIRST! */}
            {analysis.bottomLine && (
              <BottomLine
                summary={analysis.bottomLine}
                confidence={analysis.confidence}
                sourcesUsed={analysis.availableSources}
              />
            )}

            <SourceAttribution
              availableSources={analysis.availableSources as any}
              missingSources={analysis.missingSources as any}
            />

            {/* AI Insights from Grok & Gemini */}
            {analysis.intelligenceReports.length > 0 && (
              <AIInsightsPanel reports={analysis.intelligenceReports} />
            )}

            {/* Scenario Projection Chart */}
            {quote && (
              <ScenarioChart
                currentPrice={quote.price}
                scenarios={analysis.scenarios}
                timeframeMonths={6}
              />
            )}

            <div className="space-y-3">
              <ScenarioCard type="bull" scenario={analysis.scenarios.bull} />
              <ScenarioCard type="base" scenario={analysis.scenarios.base} />
              <ScenarioCard type="bear" scenario={analysis.scenarios.bear} />
            </div>

            {analysis.tokenUsage && (
              <div className="text-center text-slate-500 text-sm">
                Cost: ${analysis.tokenUsage.cost.toFixed(4)} | Tokens:{' '}
                {analysis.tokenUsage.input + analysis.tokenUsage.output}
              </div>
            )}
          </div>
        )}

        {/* Prediction History - Show past analyses and their accuracy */}
        {quote && (() => {
          const history = getHistory(symbol);
          // Skip the first one (current analysis) and show older ones
          const pastAnalyses = history.slice(1, 6); // Show up to 5 past analyses

          if (pastAnalyses.length === 0) return null;

          // Calculate accuracy stats
          const accuracyResults = pastAnalyses
            .map(entry => calculatePredictionAccuracy(entry, quote.price))
            .filter(Boolean);

          const hitCount = accuracyResults.filter(r => r && !r.isTooRecent && (r.verdict.includes('Achieved') || r.verdict.includes('Hit'))).length;
          const judgeableCount = accuracyResults.filter(r => r && !r.isTooRecent).length;

          return (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  📈 Prediction History
                  {judgeableCount > 0 && (
                    <span className="text-slate-400 text-sm font-normal">
                      • {hitCount}/{judgeableCount} accurate
                    </span>
                  )}
                </h3>
                {history.length > 3 && (
                  <button
                    onClick={() => setShowAnalysisArchive(true)}
                    className="text-indigo-400 text-xs flex items-center gap-1 hover:text-indigo-300 transition-colors"
                  >
                    <Archive className="w-3 h-3" />
                    View All ({history.length})
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {pastAnalyses.map((entry) => {
                  const accuracy = calculatePredictionAccuracy(entry, quote.price);
                  if (!accuracy) return null;

                  const analysisDate = new Date(entry.timestamp);
                  const dateStr = `${analysisDate.getDate().toString().padStart(2, '0')}.${(analysisDate.getMonth() + 1).toString().padStart(2, '0')}.${analysisDate.getFullYear()}`;

                  return (
                    <div key={entry.id} className="bg-slate-800/50 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400">
                          {dateStr} ({accuracy.daysSince} days ago)
                        </span>
                        <span className={`${accuracy.verdictColor} font-medium flex items-center gap-1`}>
                          {accuracy.verdictIcon} {accuracy.verdict}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Price then:</span>
                          <span className="text-slate-300">${accuracy.priceAtAnalysis.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Now:</span>
                          <span className={accuracy.actualChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            ${accuracy.currentPrice.toFixed(2)} ({accuracy.actualChange >= 0 ? '+' : ''}{accuracy.actualChange.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      {!accuracy.isTooRecent && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50 grid grid-cols-3 gap-1 text-xs">
                          <div className="text-center">
                            <span className={accuracy.bullTarget && accuracy.currentPrice >= accuracy.bullTarget ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                              🐂 {accuracy.bullProb}%
                              {accuracy.bullTarget && accuracy.currentPrice >= accuracy.bullTarget && ' ✓'}
                            </span>
                          </div>
                          <div className="text-center">
                            <span className={accuracy.baseTarget && Math.abs(accuracy.currentPrice - accuracy.baseTarget) / accuracy.baseTarget < 0.1 ? 'text-blue-400 font-medium' : 'text-slate-500'}>
                              📊 {accuracy.baseProb}%
                              {accuracy.baseTarget && Math.abs(accuracy.currentPrice - accuracy.baseTarget) / accuracy.baseTarget < 0.1 && ' ✓'}
                            </span>
                          </div>
                          <div className="text-center">
                            <span className={accuracy.bearTarget && accuracy.currentPrice <= accuracy.bearTarget ? 'text-rose-400 font-medium' : 'text-slate-500'}>
                              🐻 {accuracy.bearProb}%
                              {accuracy.bearTarget && accuracy.currentPrice <= accuracy.bearTarget && ' ✓'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {history.length > 6 && (
                <p className="text-slate-500 text-xs text-center mt-3">
                  Showing last 5 of {history.length - 1} past analyses
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </div>

    {/* Analysis History Archive Modal */}
    {showAnalysisArchive && quote && (() => {
      const history = getHistory(symbol);

      return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-indigo-400" />
                Analysis Archive
                <span className="text-slate-400 text-sm font-normal">({history.length})</span>
              </h2>
              <button
                onClick={() => setShowAnalysisArchive(false)}
                className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* All Analyses */}
            <div className="space-y-3">
              {history.map((entry, index) => {
                const accuracy = calculatePredictionAccuracy(entry, quote.price);
                if (!accuracy) return null;

                const analysisDate = new Date(entry.timestamp);
                const dateStr = `${analysisDate.getDate().toString().padStart(2, '0')}.${(analysisDate.getMonth() + 1).toString().padStart(2, '0')}.${analysisDate.getFullYear()}`;
                const isLatest = index === 0;

                return (
                  <div
                    key={entry.id}
                    className={`bg-slate-900/70 border rounded-xl p-4 ${isLatest ? 'border-indigo-500/50' : 'border-slate-800/50'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {dateStr}
                        </span>
                        {isLatest && (
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">
                            Latest
                          </span>
                        )}
                        <span className="text-slate-500 text-sm">
                          ({accuracy.daysSince} days ago)
                        </span>
                      </div>
                      <span className={`${accuracy.verdictColor} font-medium flex items-center gap-1`}>
                        {accuracy.verdictIcon} {accuracy.verdict}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Price then:</span>
                        <span className="text-white">${accuracy.priceAtAnalysis.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Now:</span>
                        <span className={accuracy.actualChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          ${accuracy.currentPrice.toFixed(2)} ({accuracy.actualChange >= 0 ? '+' : ''}{accuracy.actualChange.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Scenario probabilities */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className={`text-center p-2 rounded-lg ${accuracy.bullTarget && accuracy.currentPrice >= accuracy.bullTarget ? 'bg-emerald-500/20' : 'bg-slate-800/50'}`}>
                        <span className={accuracy.bullTarget && accuracy.currentPrice >= accuracy.bullTarget ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                          🐂 Bull {accuracy.bullProb}%
                          {accuracy.bullTarget && accuracy.currentPrice >= accuracy.bullTarget && ' ✓'}
                        </span>
                      </div>
                      <div className={`text-center p-2 rounded-lg ${accuracy.baseTarget && Math.abs(accuracy.currentPrice - accuracy.baseTarget) / accuracy.baseTarget < 0.1 ? 'bg-blue-500/20' : 'bg-slate-800/50'}`}>
                        <span className={accuracy.baseTarget && Math.abs(accuracy.currentPrice - accuracy.baseTarget) / accuracy.baseTarget < 0.1 ? 'text-blue-400 font-medium' : 'text-slate-400'}>
                          📊 Base {accuracy.baseProb}%
                          {accuracy.baseTarget && Math.abs(accuracy.currentPrice - accuracy.baseTarget) / accuracy.baseTarget < 0.1 && ' ✓'}
                        </span>
                      </div>
                      <div className={`text-center p-2 rounded-lg ${accuracy.bearTarget && accuracy.currentPrice <= accuracy.bearTarget ? 'bg-rose-500/20' : 'bg-slate-800/50'}`}>
                        <span className={accuracy.bearTarget && accuracy.currentPrice <= accuracy.bearTarget ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                          🐻 Bear {accuracy.bearProb}%
                          {accuracy.bearTarget && accuracy.currentPrice <= accuracy.bearTarget && ' ✓'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clear History Button */}
            {history.length > 1 && (
              <button
                onClick={() => {
                  if (confirm(`Delete all ${history.length} analyses for ${symbol}?`)) {
                    clearHistory(symbol);
                    setShowAnalysisArchive(false);
                  }
                }}
                className="w-full mt-6 py-3 text-rose-400 text-sm flex items-center justify-center gap-2 hover:bg-rose-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All History
              </button>
            )}
          </div>
        </div>
      );
    })()}
    </>
  );
});

/**
 * Loading skeleton for detail view
 */
function DetailViewSkeleton({
  onBack,
  symbol,
}: {
  onBack: () => void;
  symbol: string;
}) {
  return (
    <div className="min-h-screen bg-black">
      <div className="flex items-center gap-4 p-4 border-b border-slate-800/50">
        <button onClick={onBack} className="text-slate-400">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{symbol}</h1>
          <div className="h-4 bg-slate-800 rounded w-32 mt-1 animate-pulse" />
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="h-64 bg-slate-900/50 rounded-2xl animate-pulse" />
        <div className="h-48 bg-slate-900/50 rounded-2xl animate-pulse" />
        <div className="h-14 bg-slate-900/50 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export default DetailView;
