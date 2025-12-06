/**
 * PortfolioAnalysis - AI-powered portfolio analysis
 *
 * Features:
 * - Analyze entire portfolio with Claude
 * - Sector diversification breakdown
 * - Risk assessment
 * - Portfolio-wide bull/base/bear projections
 * - Rebalancing suggestions
 */

import { useState, memo, useCallback } from 'react';
import { Sparkles, TrendingUp, Shield, AlertTriangle, PieChart, RefreshCw, Loader2 } from 'lucide-react';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { PortfolioProjectionChart } from './PortfolioProjectionChart';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Position {
  symbol: string;
  name: string;
  shares: number;
  price: number;
  value: number;
  weight: number;
  changePercent: number;
}

interface PortfolioAnalysisResult {
  summary: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  riskScore: number; // 1-10
  diversification: {
    sectorBreakdown: Array<{ sector: string; weight: number }>;
    score: 'poor' | 'fair' | 'good' | 'excellent';
    suggestion?: string;
  };
  projections: {
    bullCase: { percent: number; reasoning: string };
    baseCase: { percent: number; reasoning: string };
    bearCase: { percent: number; reasoning: string };
  };
  topRisks: string[];
  opportunities: string[];
  rebalancingSuggestions?: string[];
}

interface PortfolioAnalysisProps {
  positions: Position[];
  totalValue: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTOR MAPPING
// ═══════════════════════════════════════════════════════════════════════════

const STOCK_SECTORS: Record<string, string> = {
  // Tech
  AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Technology', META: 'Technology',
  NVDA: 'Technology', AMD: 'Technology', INTC: 'Technology', CRM: 'Technology',
  // Consumer
  AMZN: 'Consumer', TSLA: 'Consumer', NFLX: 'Consumer', DIS: 'Consumer',
  // Finance
  JPM: 'Finance', V: 'Finance', MA: 'Finance', BAC: 'Finance', GS: 'Finance',
  // Healthcare
  JNJ: 'Healthcare', UNH: 'Healthcare', PFE: 'Healthcare', LLY: 'Healthcare',
  // Crypto-related
  COIN: 'Crypto', MSTR: 'Crypto', MARA: 'Crypto', RIOT: 'Crypto',
  // Energy
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const PortfolioAnalysis = memo(function PortfolioAnalysis({
  positions,
  totalValue,
}: PortfolioAnalysisProps) {
  const { getApiKey } = useApiKeysStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PortfolioAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const anthropicKey = getApiKey('anthropic');

  // Calculate sector breakdown
  const sectorBreakdown = positions.reduce((acc, pos) => {
    const sector = STOCK_SECTORS[pos.symbol] || 'Other';
    acc[sector] = (acc[sector] || 0) + pos.weight;
    return acc;
  }, {} as Record<string, number>);

  const sectors = Object.entries(sectorBreakdown)
    .map(([sector, weight]) => ({ sector, weight }))
    .sort((a, b) => b.weight - a.weight);

  // Analyze portfolio
  const runAnalysis = useCallback(async () => {
    if (!anthropicKey || positions.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: `Analyze this stock portfolio and provide investment insights.

PORTFOLIO (Total: $${totalValue.toLocaleString()}):
${positions.map(p => `- ${p.symbol} (${p.name}): ${p.shares} shares @ $${p.price.toFixed(2)} = $${p.value.toLocaleString()} (${p.weight.toFixed(1)}% of portfolio, today: ${p.changePercent >= 0 ? '+' : ''}${p.changePercent.toFixed(2)}%)`).join('\n')}

SECTOR BREAKDOWN:
${sectors.map(s => `- ${s.sector}: ${s.weight.toFixed(1)}%`).join('\n')}

Provide analysis as JSON only:
{
  "summary": "<2-3 sentence portfolio overview>",
  "riskLevel": "<low|moderate|high|very-high>",
  "riskScore": <1-10>,
  "diversification": {
    "score": "<poor|fair|good|excellent>",
    "suggestion": "<optional rebalancing tip>"
  },
  "projections": {
    "bullCase": { "percent": <+X>, "reasoning": "<1 sentence>" },
    "baseCase": { "percent": <+/-X>, "reasoning": "<1 sentence>" },
    "bearCase": { "percent": <-X>, "reasoning": "<1 sentence>" }
  },
  "topRisks": ["<risk 1>", "<risk 2>"],
  "opportunities": ["<opportunity 1>", "<opportunity 2>"],
  "rebalancingSuggestions": ["<optional suggestion>"]
}

Be realistic with projections (6-month timeframe). Return ONLY valid JSON.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (!content) throw new Error('Empty response');

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse response');

      const result = JSON.parse(jsonMatch[0]);

      setAnalysis({
        summary: result.summary,
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        diversification: {
          sectorBreakdown: sectors,
          score: result.diversification.score,
          suggestion: result.diversification.suggestion,
        },
        projections: result.projections,
        topRisks: result.topRisks || [],
        opportunities: result.opportunities || [],
        rebalancingSuggestions: result.rebalancingSuggestions,
      });
    } catch (err) {
      console.error('Portfolio analysis failed:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [positions, totalValue, sectors, anthropicKey]);

  // No API key
  if (!anthropicKey) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-white font-medium">Portfolio Analysis</span>
        </div>
        <p className="text-slate-500 text-sm">
          Add Claude API key in Settings to analyze your portfolio
        </p>
      </div>
    );
  }

  // Not enough positions
  if (positions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Analysis Button */}
      {!analysis && (
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${
            isAnalyzing
              ? 'bg-purple-600/20 border border-purple-500/30'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={20} className="text-purple-400 animate-spin" />
              <span className="text-purple-300 font-medium">Analyzing Portfolio...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} className="text-white" />
              <span className="text-white font-semibold">Analyze My Portfolio</span>
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Summary Card */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <span className="text-white font-medium">AI Analysis</span>
              </div>
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="text-slate-400 hover:text-white p-1"
              >
                <RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
              </button>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {/* Risk & Diversification */}
          <div className="grid grid-cols-2 gap-3">
            {/* Risk Level */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className={
                  analysis.riskLevel === 'low' ? 'text-emerald-400' :
                  analysis.riskLevel === 'moderate' ? 'text-amber-400' :
                  analysis.riskLevel === 'high' ? 'text-orange-400' :
                  'text-rose-400'
                } />
                <span className="text-slate-400 text-xs">Risk Level</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${
                  analysis.riskLevel === 'low' ? 'text-emerald-400' :
                  analysis.riskLevel === 'moderate' ? 'text-amber-400' :
                  analysis.riskLevel === 'high' ? 'text-orange-400' :
                  'text-rose-400'
                }`}>
                  {analysis.riskLevel.charAt(0).toUpperCase() + analysis.riskLevel.slice(1)}
                </span>
                <span className="text-slate-500 text-xs">{analysis.riskScore}/10</span>
              </div>
            </div>

            {/* Diversification */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <PieChart size={14} className="text-blue-400" />
                <span className="text-slate-400 text-xs">Diversification</span>
              </div>
              <span className={`text-xl font-bold ${
                analysis.diversification.score === 'excellent' ? 'text-emerald-400' :
                analysis.diversification.score === 'good' ? 'text-blue-400' :
                analysis.diversification.score === 'fair' ? 'text-amber-400' :
                'text-rose-400'
              }`}>
                {analysis.diversification.score.charAt(0).toUpperCase() + analysis.diversification.score.slice(1)}
              </span>
            </div>
          </div>

          {/* Sector Breakdown */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <h4 className="text-white font-medium text-sm mb-3">Sector Allocation</h4>
            <div className="space-y-2">
              {sectors.slice(0, 5).map((s, i) => (
                <div key={s.sector} className="flex items-center gap-3">
                  <div className="w-20 text-slate-400 text-xs truncate">{s.sector}</div>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'][i % 5]
                      }`}
                      style={{ width: `${Math.min(s.weight, 100)}%` }}
                    />
                  </div>
                  <span className="text-slate-400 text-xs w-12 text-right">{s.weight.toFixed(1)}%</span>
                </div>
              ))}
            </div>
            {analysis.diversification.suggestion && (
              <p className="text-slate-500 text-xs mt-3 italic">
                {analysis.diversification.suggestion}
              </p>
            )}
          </div>

          {/* Projection Chart */}
          <PortfolioProjectionChart
            currentValue={totalValue}
            projections={{
              bull: totalValue * (1 + analysis.projections.bullCase.percent / 100),
              base: totalValue * (1 + analysis.projections.baseCase.percent / 100),
              bear: totalValue * (1 + analysis.projections.bearCase.percent / 100),
            }}
          />

          {/* Risks & Opportunities */}
          <div className="grid grid-cols-2 gap-3">
            {/* Risks */}
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={12} className="text-rose-400" />
                <span className="text-rose-400 text-xs font-medium">Top Risks</span>
              </div>
              <ul className="space-y-1">
                {analysis.topRisks.slice(0, 2).map((risk, i) => (
                  <li key={i} className="text-rose-300 text-xs">• {risk}</li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="text-emerald-400 text-xs font-medium">Opportunities</span>
              </div>
              <ul className="space-y-1">
                {analysis.opportunities.slice(0, 2).map((opp, i) => (
                  <li key={i} className="text-emerald-300 text-xs">• {opp}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default PortfolioAnalysis;
