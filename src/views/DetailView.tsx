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
import { NewsPanel } from '@/components/analysis/NewsPanel';
import { ScopeButton } from '@/components/analysis/ScopeButton';
import { ScenarioCard } from '@/components/analysis/ScenarioCard';
import { SourceAttribution } from '@/components/analysis/SourceAttribution';
import { AIInsightsPanel } from '@/components/analysis/AIInsightsPanel';
import { BottomLine } from '@/components/analysis/BottomLine';
import { HoldingsInput } from '@/components/portfolio/HoldingsInput';
import { WarpAnimation } from '@/components/effects/WarpAnimation';
import {
  getQuote,
  getDailyData,
} from '@/services/marketData';
import { getMockQuote, getMockDailyData } from '@/services/api/polygon';
import { getStockNews, type NewsArticle } from '@/services/api/newsapi';
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
  const newsApiKey = getApiKey('newsapi');

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [priceData, setPriceData] = useState<HistoricalDataPoint[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyName =
    watchlistItems.find((w) => w.symbol === symbol)?.name ||
    COMPANY_NAMES[symbol] ||
    symbol;

  // Load price data and news on mount
  useEffect(() => {
    loadPriceData();
    loadNews();

    // Check for existing analysis
    const existing = getLatestAnalysis(symbol);
    if (existing?.result) {
      // Convert existing analysis to our format
      setAnalysis({
        scenarios: existing.result as any,
        confidence: 75,
        availableSources: ['technical-analysis'],
        missingSources: [],
        intelligenceReports: [],
      });
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
      setPriceData(dailyResult.data);
    } catch (err) {
      setError('Failed to load price data');
      console.error(err);
      // Fallback to mock
      setQuote(getMockQuote(symbol));
      setPriceData(getMockDailyData(symbol, 365));
    } finally {
      setIsLoadingPrice(false);
    }
  }, [symbol]);

  const loadNews = useCallback(async () => {
    if (!newsApiKey) {
      setNews([]);
      return;
    }

    setIsLoadingNews(true);
    try {
      const articles = await getStockNews(symbol, companyName, newsApiKey);
      setNews(articles);
    } catch (err) {
      console.error('Failed to load news:', err);
      setNews([]);
    } finally {
      setIsLoadingNews(false);
    }
  }, [symbol, companyName, newsApiKey]);

  const runAnalysis = useCallback(async () => {
    if (!anthropicKey || !quote) return;

    setIsAnalyzing(true);
    setError(null);

    // Track start time for minimum animation duration
    const startTime = Date.now();
    const MIN_ANIMATION_TIME = 3000; // 3 seconds minimum

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

      // Build analysis result
      const analysisResult: AnalysisResult = {
        scenarios: result.scenarios,
        confidence: result.confidence || 75,
        bottomLine: result.bottomLine,
        availableSources: intelligence.availableSources,
        missingSources: intelligence.missingSources,
        intelligenceReports: intelligence.reports,
        tokenUsage: result.tokenUsage,
      };

      setAnalysis(analysisResult);

      // Save to store
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
        result: result as any,
        tokenUsage: result.tokenUsage
          ? { input: result.tokenUsage.input, output: result.tokenUsage.output, total: result.tokenUsage.input + result.tokenUsage.output }
          : { input: 0, output: 0, total: 0 },
        cost: result.tokenUsage?.cost || 0,
        dominantScenario: 'base',
      });
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [symbol, companyName, priceData, quote, anthropicKey, addAnalysis]);

  if (isLoadingPrice) {
    return <DetailViewSkeleton onBack={onBack} symbol={symbol} />;
  }

  return (
    <>
      {/* Warp Animation Overlay */}
      <WarpAnimation isActive={isAnalyzing} />

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

        {/* News Panel */}
        {newsApiKey && (
          <NewsPanel articles={news} isLoading={isLoadingNews} />
        )}

        {/* Scope Button */}
        <ScopeButton
          symbol={symbol}
          onAnalyze={runAnalysis}
          isLoading={isAnalyzing}
          estimatedCost={{ min: 0.01, max: 0.04, avg: 0.025 }}
          hasApiKey={!!anthropicKey}
          disabled={isLoadingPrice}
        />

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <p className="text-rose-400">{error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
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
