/**
 * IntelligenceReport - Summary screen showing what each AI delivered
 *
 * Features:
 * - Shows Claude's overall verdict (bullish/bearish/neutral)
 * - Lists all intelligence sources with their status
 * - Claude's per-source assessment with 1-10 scores
 * - Token usage and cost summary
 */

import { memo } from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, Zap } from 'lucide-react';

export interface SourceReport {
  id: string;
  name: string;
  icon: string;
  delivered: boolean;
  tokensUsed?: number;
  summary?: string;
  error?: string;
}

export interface ClaudeAssessment {
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number; // 1-10
  reason: string;
}

interface IntelligenceReportProps {
  sources: SourceReport[];
  assessments: ClaudeAssessment[];
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  overallScore: number;
  totalTokens: number;
  estimatedCost: number;
  onContinue: () => void;
}

export const IntelligenceReport = memo(function IntelligenceReport({
  sources,
  assessments,
  overallSentiment,
  overallScore,
  totalTokens,
  estimatedCost,
  onContinue,
}: IntelligenceReportProps) {

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-emerald-400';
      case 'bearish': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'bg-emerald-500/20 border-emerald-500/30';
      case 'bearish': return 'bg-rose-500/20 border-rose-500/30';
      default: return 'bg-slate-500/20 border-slate-500/30';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-5 h-5" />;
      case 'bearish': return <TrendingDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const getScoreBar = (score: number) => {
    // 1-5 = bearish (red), 5 = neutral, 6-10 = bullish (green)
    const percentage = (score / 10) * 100;
    const color = score < 5 ? 'bg-rose-500' : score > 5 ? 'bg-emerald-500' : 'bg-slate-500';

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-sm font-bold ${score < 5 ? 'text-rose-400' : score > 5 ? 'text-emerald-400' : 'text-slate-400'}`}>
          {score}/10
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
      <div className="min-h-screen p-4 pb-24">
        {/* Header */}
        <div className="text-center pt-8 pb-6">
          <div className="text-3xl mb-2">📋</div>
          <h1 className="text-2xl font-bold text-white">Intelligence Report</h1>
          <p className="text-slate-400 text-sm mt-1">Analysis complete</p>
        </div>

        {/* Overall Assessment Card */}
        <div className={`rounded-2xl p-5 border mb-6 ${getSentimentBg(overallSentiment)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getSentimentBg(overallSentiment)}`}>
                <span className={getSentimentColor(overallSentiment)}>
                  {getSentimentIcon(overallSentiment)}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold">Claude's Verdict</p>
                <p className={`text-lg font-bold uppercase ${getSentimentColor(overallSentiment)}`}>
                  {overallSentiment}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">Confidence</p>
              <p className="text-2xl font-bold text-white">{overallScore}/10</p>
            </div>
          </div>
          {getScoreBar(overallScore)}
        </div>

        {/* Sources Summary */}
        <div className="mb-6">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Intelligence Sources
          </h2>
          <div className="space-y-2">
            {sources.map(source => (
              <div
                key={source.id}
                className={`rounded-xl p-4 border ${
                  source.delivered
                    ? 'bg-slate-800/50 border-slate-700/50'
                    : 'bg-slate-900/50 border-slate-800/30 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{source.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{source.name}</span>
                        {source.delivered ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">
                        {source.delivered
                          ? source.summary || 'Data received'
                          : source.error || 'Not configured'
                        }
                      </p>
                    </div>
                  </div>
                  {source.tokensUsed && source.tokensUsed > 0 && (
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Tokens</p>
                      <p className="text-slate-300 text-sm font-mono">
                        {source.tokensUsed.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Claude's Per-Source Assessment */}
        {assessments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">🧠</span>
              Claude's Assessment by Source
            </h2>
            <div className="space-y-3">
              {assessments.map(assessment => (
                <div
                  key={assessment.source}
                  className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{assessment.source}</span>
                    <span className={`text-sm font-bold uppercase ${getSentimentColor(assessment.sentiment)}`}>
                      {assessment.sentiment}
                    </span>
                  </div>
                  {getScoreBar(assessment.score)}
                  <p className="text-slate-400 text-sm mt-2">
                    {assessment.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Summary */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-sm">Total Tokens Used</p>
              <p className="text-white font-mono text-lg">{totalTokens.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Estimated Cost</p>
              <p className="text-white font-mono text-lg">${estimatedCost.toFixed(4)}</p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-4 rounded-xl transition-all active:scale-[0.98]"
        >
          View Bull / Bear / Base Scenarios →
        </button>
      </div>
    </div>
  );
});

export default IntelligenceReport;
