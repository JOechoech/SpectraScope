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

import { useState, useEffect, memo, useCallback } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
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
  const { addAnalysis, getLatestAnalysis } = useAnalysisStore();
  const { items: watchlistItems } = useWatchlistStore();

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

  const companyName =
    watchlistItems.find((w) => w.symbol === symbol)?.name ||
    COMPANY_NAMES[symbol] ||
    symbol;

  // Check if analysis is recent (within 24 hours)
  const isAnalysisRecent = (timestamp: string): boolean => {
    const analysisTime = new Date(timestamp).getTime();
    const now = Date.now();
    const hoursDiff = (now - analysisTime) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  // Load price data on mount and check for cached analysis
  useEffect(() => {
    loadPriceData();

    // Check for existing analysis
    const existing = getLatestAnalysis(symbol);
    if (existing?.result && isAnalysisRecent(existing.timestamp)) {
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

  const runAnalysis = useCallback(async () => {
    if (!anthropicKey || !quote) return;

    setAnalysisPhase('gathering');
    setError(null);

    // Track start time for minimum animation duration
    const startTime = Date.now();
    const MIN_ANIMATION_TIME = 6000; // 6 seconds for AI arrivals

    try {
      // Gather intelligence from all sources
      const intelligence = await gatherIntelligence({
        symbol,
        companyName,
        priceData,
        currentPrice: quote.price,
      });

      // Run Claude synthesis
      const result = await synthesizeFromIntelligence(
        intelligence,
        anthropicKey
      );

      // Ensure minimum animation time for better UX
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_ANIMATION_TIME) {
        await new Promise((r) => setTimeout(r, MIN_ANIMATION_TIME - elapsed));
      }

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
    }
  }, [symbol, companyName, priceData, quote, anthropicKey, addAnalysis]);

  if (isLoadingPrice) {
    return <DetailViewSkeleton onBack={onBack} symbol={symbol} />;
  }

  // Calculate totals for Intelligence Report
  const totalTokens = sourceReports.reduce((sum, s) => sum + (s.tokensUsed || 0), 0);
  const estimatedCost = analysis?.tokenUsage?.cost || (totalTokens * 0.00003);

  return (
    <>
      {/* Warp Animation Overlay */}
      <WarpAnimation isActive={analysisPhase === 'gathering'} />

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

        {/* Technical Signals (Auto-loads) */}
        {quote && priceData.length > 0 && (
          <TechnicalSignalsPanel
            priceData={priceData}
            currentPrice={quote.price}
          />
        )}

        {/* News is now analyzed via OpenAI during Scope Analysis */}

        {/* Scope Button - Show refresh option if cached analysis exists */}
        {analysisPhase === 'results' && analysis ? (
          <div className="space-y-3">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-emerald-400 text-sm font-medium">
                    Analysis loaded from cache
                  </span>
                </div>
                <button
                  onClick={() => {
                    setAnalysisPhase('idle');
                    setAnalysis(null);
                  }}
                  className="px-3 py-1.5 bg-slate-800/50 text-slate-300 rounded-lg text-sm hover:bg-slate-700/50 transition-colors"
                >
                  Refresh Analysis
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                Cached analyses save you money. Click Refresh to run a new analysis (~$0.02).
              </p>
            </div>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
              <span className="text-slate-400 text-sm">
                Confidence: {analysis.confidence}%
              </span>
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
      </div>
    </div>
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
