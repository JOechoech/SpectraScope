/**
 * Intelligence Types for Multi-AI Architecture
 *
 * Defines the data structures for all intelligence sources
 * that feed into Claude's Master Synthesizer.
 */

import type { TechnicalIndicators } from './index';
import type { AggregateScore, SignalResult } from '@/utils/signals';

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type IntelligenceSource =
  | 'technical-analysis' // Client-side computed
  | 'news-sentiment' // Finnhub, Benzinga
  | 'social-sentiment' // Grok (X/Twitter)
  | 'web-research' // Perplexity
  | 'options-flow'; // Polygon, Yahoo

// ═══════════════════════════════════════════════════════════════════════════
// BASE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base interface for all intelligence sources
 */
export interface IntelligenceReport {
  source: IntelligenceSource;
  timestamp: string;
  confidence: number; // 0-100
  data: unknown; // Source-specific data
  summary: string; // Human-readable summary for Claude
}

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICAL ANALYSIS REPORT
// ═══════════════════════════════════════════════════════════════════════════

export interface TechnicalReportData {
  indicators: TechnicalIndicators;
  signals: SignalResult[];
  aggregateScore: AggregateScore;
  pricePosition: {
    nearSupport: boolean;
    nearResistance: boolean;
    trendDirection: 'uptrend' | 'downtrend' | 'sideways';
  };
}

export interface TechnicalReport extends IntelligenceReport {
  source: 'technical-analysis';
  data: TechnicalReportData;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEWS SENTIMENT REPORT
// ═══════════════════════════════════════════════════════════════════════════

export interface NewsHeadline {
  title: string;
  source: string;
  url?: string;
  publishedAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevance: number; // 0-1
}

export interface NewsReportData {
  headlines: NewsHeadline[];
  overallSentiment: 'bullish' | 'neutral' | 'bearish';
  sentimentScore: number; // -1 to 1
  articleCount: number;
  topSources: string[];
}

export interface NewsReport extends IntelligenceReport {
  source: 'news-sentiment';
  data: NewsReportData;
}

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL SENTIMENT REPORT (Grok/X)
// ═══════════════════════════════════════════════════════════════════════════

export interface SocialReportData {
  platform: 'twitter' | 'reddit' | 'stocktwits';
  mentionCount: number;
  sentimentScore: number; // -1 to 1
  trending: boolean;
  trendingRank?: number;
  topTakes: string[]; // Key opinions/takes
  retailVsInstitutional: 'retail-heavy' | 'mixed' | 'institutional';
  engagementMetrics: {
    likes: number;
    retweets: number;
    replies: number;
  };
  influentialPosts?: Array<{
    author: string;
    text: string;
    engagement: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
}

export interface SocialReport extends IntelligenceReport {
  source: 'social-sentiment';
  data: SocialReportData;
}

// ═══════════════════════════════════════════════════════════════════════════
// WEB RESEARCH REPORT (Perplexity)
// ═══════════════════════════════════════════════════════════════════════════

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
}

export interface ResearchReportData {
  keyFindings: string[];
  recentDevelopments: string[];
  analystConsensus: string;
  priceTargets?: {
    low: number;
    median: number;
    high: number;
    numberOfAnalysts: number;
  };
  upcomingEvents: string[];
  citations: Citation[];
}

export interface ResearchReport extends IntelligenceReport {
  source: 'web-research';
  data: ResearchReportData;
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTIONS FLOW REPORT
// ═══════════════════════════════════════════════════════════════════════════

export interface LargeOrder {
  type: 'call' | 'put';
  strike: number;
  expiry: string;
  premium: number;
  volume: number;
  openInterest: number;
  sentiment: 'bullish' | 'bearish';
}

export interface OptionsReportData {
  putCallRatio: number;
  ivRank: number; // 0-100
  ivPercentile: number; // 0-100
  unusualActivity: boolean;
  largeOrders: LargeOrder[];
  maxPain: number;
  gammaExposure: 'positive' | 'negative' | 'neutral';
  institutionalFlow: 'bullish' | 'bearish' | 'neutral';
}

export interface OptionsReport extends IntelligenceReport {
  source: 'options-flow';
  data: OptionsReportData;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Union type for all intelligence reports
 */
export type AnyIntelligenceReport =
  | TechnicalReport
  | NewsReport
  | SocialReport
  | ResearchReport
  | OptionsReport;

// ═══════════════════════════════════════════════════════════════════════════
// AGGREGATED INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Aggregated intelligence from all available sources
 * This is what gets sent to Claude for synthesis
 */
export interface AggregatedIntelligence {
  symbol: string;
  companyName?: string;
  timestamp: string;
  reports: AnyIntelligenceReport[];
  availableSources: IntelligenceSource[];
  missingSources: IntelligenceSource[];
  dataQuality: {
    score: number; // 0-100
    label: 'excellent' | 'good' | 'limited' | 'minimal';
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate data quality based on available sources
 */
export function calculateDataQuality(
  availableSources: IntelligenceSource[]
): AggregatedIntelligence['dataQuality'] {
  const sourceWeights: Record<IntelligenceSource, number> = {
    'technical-analysis': 25,
    'news-sentiment': 25,
    'social-sentiment': 15,
    'web-research': 20,
    'options-flow': 15,
  };

  const score = availableSources.reduce(
    (sum, source) => sum + sourceWeights[source],
    0
  );

  let label: AggregatedIntelligence['dataQuality']['label'];
  if (score >= 80) label = 'excellent';
  else if (score >= 60) label = 'good';
  else if (score >= 40) label = 'limited';
  else label = 'minimal';

  return { score, label };
}

/**
 * Get all possible intelligence sources
 */
export function getAllSources(): IntelligenceSource[] {
  return [
    'technical-analysis',
    'news-sentiment',
    'social-sentiment',
    'web-research',
    'options-flow',
  ];
}

/**
 * Get human-readable source name
 */
export function getSourceDisplayName(source: IntelligenceSource): string {
  const names: Record<IntelligenceSource, string> = {
    'technical-analysis': 'Technical Analysis',
    'news-sentiment': 'News Sentiment',
    'social-sentiment': 'Social Sentiment',
    'web-research': 'Web Research',
    'options-flow': 'Options Flow',
  };
  return names[source];
}

/**
 * Get source icon (emoji)
 */
export function getSourceIcon(source: IntelligenceSource): string {
  const icons: Record<IntelligenceSource, string> = {
    'technical-analysis': '📊',
    'news-sentiment': '📰',
    'social-sentiment': '🐦',
    'web-research': '🔍',
    'options-flow': '📈',
  };
  return icons[source];
}
