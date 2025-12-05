/**
 * AIInsightsPanel - Displays insights from Multi-AI sources
 *
 * Shows intelligence from:
 * - Grok (xAI): X/Twitter social sentiment
 * - Gemini (Google): Web research & analyst opinions
 * - NewsAPI: News headlines sentiment
 */

import { memo } from 'react';
import {
  MessageCircle,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  AlertTriangle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type {
  AnyIntelligenceReport,
  SocialReport,
  ResearchReport,
  SocialReportData,
  ResearchReportData,
} from '@/types/intelligence';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AIInsightsPanelProps {
  reports: AnyIntelligenceReport[];
  isLoading?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AIInsightsPanel = memo(function AIInsightsPanel({
  reports,
  isLoading = false,
  className = '',
}: AIInsightsPanelProps) {
  const socialReport = reports.find(
    (r): r is SocialReport => r.source === 'social-sentiment'
  );
  const researchReport = reports.find(
    (r): r is ResearchReport => r.source === 'web-research'
  );

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!socialReport && !researchReport) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
          <Sparkles size={18} className="text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">AI Insights</h3>
          <p className="text-slate-500 text-xs">Multi-source intelligence</p>
        </div>
      </div>

      {/* Social Sentiment (Grok) */}
      {socialReport && (
        <GrokInsightCard data={socialReport.data} confidence={socialReport.confidence} />
      )}

      {/* Research (Gemini) */}
      {researchReport && (
        <GeminiInsightCard data={researchReport.data} confidence={researchReport.confidence} />
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// GROK INSIGHT CARD
// ═══════════════════════════════════════════════════════════════════════════

interface GrokInsightCardProps {
  data: SocialReportData;
  confidence: number;
}

const GrokInsightCard = memo(function GrokInsightCard({
  data,
  confidence,
}: GrokInsightCardProps) {
  const sentimentLabel =
    data.sentimentScore > 0.2
      ? 'Bullish'
      : data.sentimentScore < -0.2
        ? 'Bearish'
        : 'Neutral';

  const sentimentColor =
    data.sentimentScore > 0.2
      ? 'text-emerald-400'
      : data.sentimentScore < -0.2
        ? 'text-rose-400'
        : 'text-slate-400';

  const SentimentIcon =
    data.sentimentScore > 0.2
      ? TrendingUp
      : data.sentimentScore < -0.2
        ? TrendingDown
        : Minus;

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-cyan-500/10 border-b border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-cyan-400" />
          <span className="text-cyan-400 font-medium text-sm">
            X/Twitter Sentiment
          </span>
          <span className="text-cyan-500/60 text-xs">(via Grok)</span>
        </div>
        <span className="text-slate-500 text-xs">{confidence}% confidence</span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Sentiment Score */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Overall Sentiment</span>
          <div className={`flex items-center gap-2 ${sentimentColor}`}>
            <SentimentIcon size={16} />
            <span className="font-semibold">{sentimentLabel}</span>
            <span className="text-slate-500 text-xs">
              ({data.sentimentScore > 0 ? '+' : ''}
              {data.sentimentScore.toFixed(2)})
            </span>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-slate-500" />
            <span className="text-slate-400">
              {data.mentionCount.toLocaleString()} mentions
            </span>
          </div>
          {data.trending && (
            <div className="flex items-center gap-1 text-amber-400">
              <TrendingUp size={12} />
              <span>Trending</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                data.retailVsInstitutional === 'retail-heavy'
                  ? 'bg-blue-500/20 text-blue-400'
                  : data.retailVsInstitutional === 'institutional'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-slate-500/20 text-slate-400'
              }`}
            >
              {data.retailVsInstitutional}
            </span>
          </div>
        </div>

        {/* Top Takes */}
        {data.topTakes && data.topTakes.length > 0 && (
          <div className="pt-2 border-t border-slate-800/50">
            <p className="text-slate-500 text-xs mb-2">Top Takes from X:</p>
            <div className="space-y-1.5">
              {data.topTakes.slice(0, 3).map((take, i) => (
                <p key={i} className="text-slate-300 text-xs italic">
                  "{take}"
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// GEMINI INSIGHT CARD
// ═══════════════════════════════════════════════════════════════════════════

interface GeminiInsightCardProps {
  data: ResearchReportData;
  confidence: number;
}

const GeminiInsightCard = memo(function GeminiInsightCard({
  data,
  confidence,
}: GeminiInsightCardProps) {
  const consensusColor = getConsensusColor(data.analystConsensus);

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-purple-500/10 border-b border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-purple-400" />
          <span className="text-purple-400 font-medium text-sm">
            Analyst Research
          </span>
          <span className="text-purple-500/60 text-xs">(via Gemini)</span>
        </div>
        <span className="text-slate-500 text-xs">{confidence}% confidence</span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Analyst Consensus */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Analyst Consensus</span>
          <span className={`font-semibold ${consensusColor}`}>
            {data.analystConsensus.replace('Analyst consensus: ', '')}
          </span>
        </div>

        {/* Price Targets */}
        {data.priceTargets && (
          <div className="flex items-center gap-4 text-xs bg-slate-800/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5">
              <Target size={12} className="text-slate-500" />
              <span className="text-slate-500">Price Targets:</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-rose-400">
                Low: ${data.priceTargets.low.toFixed(0)}
              </span>
              <span className="text-emerald-400 font-medium">
                Median: ${data.priceTargets.median.toFixed(0)}
              </span>
              <span className="text-blue-400">
                High: ${data.priceTargets.high.toFixed(0)}
              </span>
            </div>
          </div>
        )}

        {/* Key Findings */}
        {data.keyFindings && data.keyFindings.length > 0 && (
          <div className="pt-2 border-t border-slate-800/50">
            <p className="text-slate-500 text-xs mb-2">Key Findings:</p>
            <ul className="space-y-1">
              {data.keyFindings.slice(0, 3).map((finding, i) => (
                <li
                  key={i}
                  className="text-slate-300 text-xs flex items-start gap-2"
                >
                  <span className="text-purple-400 mt-0.5">•</span>
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Developments */}
        {data.recentDevelopments && data.recentDevelopments.length > 0 && (
          <div className="pt-2 border-t border-slate-800/50">
            <p className="text-slate-500 text-xs mb-2">Recent Developments:</p>
            <ul className="space-y-1">
              {data.recentDevelopments.slice(0, 2).map((dev, i) => (
                <li
                  key={i}
                  className="text-slate-400 text-xs flex items-start gap-2"
                >
                  <AlertTriangle size={10} className="text-amber-400 mt-0.5" />
                  {dev}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Citations */}
        {data.citations && data.citations.length > 0 && (
          <div className="pt-2 border-t border-slate-800/50 flex items-center gap-2">
            <ExternalLink size={10} className="text-slate-600" />
            <span className="text-slate-600 text-[10px]">
              {data.citations.length} source(s) referenced
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getConsensusColor(consensus: string): string {
  const lower = consensus.toLowerCase();
  if (lower.includes('strong-buy') || lower.includes('strong buy')) {
    return 'text-emerald-400';
  }
  if (lower.includes('buy')) {
    return 'text-green-400';
  }
  if (lower.includes('hold')) {
    return 'text-amber-400';
  }
  if (lower.includes('strong-sell') || lower.includes('strong sell')) {
    return 'text-rose-500';
  }
  if (lower.includes('sell')) {
    return 'text-rose-400';
  }
  return 'text-slate-400';
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-slate-800" />
        <div className="space-y-1.5">
          <div className="w-24 h-4 rounded bg-slate-800" />
          <div className="w-32 h-3 rounded bg-slate-800/50" />
        </div>
      </div>

      {/* Card 1 */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3">
        <div className="w-32 h-4 rounded bg-slate-800" />
        <div className="w-full h-16 rounded bg-slate-800/50" />
      </div>

      {/* Card 2 */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3">
        <div className="w-32 h-4 rounded bg-slate-800" />
        <div className="w-full h-16 rounded bg-slate-800/50" />
      </div>
    </div>
  );
});

export default AIInsightsPanel;
