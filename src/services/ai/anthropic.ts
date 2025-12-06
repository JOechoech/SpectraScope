/**
 * Anthropic Claude API Service
 *
 * Handles AI-powered scenario generation for the Deep Dive analysis.
 *
 * Model: Claude Sonnet 4 (claude-sonnet-4-20250514)
 *
 * Token Costs (as of 2025):
 * - Input: $3 per 1M tokens
 * - Output: $15 per 1M tokens
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  DeepDiveResult,
  Scenario,
  StockQuote,
  TechnicalIndicators,
  NewsItem,
} from '@/types';
import type { AggregateScore } from '@/utils/signals';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Use Claude Sonnet 4.5 for synthesis (fast, cost-effective)
const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 4000;

// Token cost estimation (USD per 1K tokens) - Sonnet 4.5 pricing
const INPUT_COST_PER_1K = 0.003;  // $3 per 1M tokens
const OUTPUT_COST_PER_1K = 0.015; // $15 per 1M tokens

// ═══════════════════════════════════════════════════════════════════════════
// ENGLISH PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are an experienced financial analyst with expertise in both fundamental and technical analysis. Your analyses are precise, data-driven, and consider both quantitative and qualitative factors.

Your task is to create three realistic scenarios for a stock:

1. **Bull Case (Optimistic)**: The best realistic scenario based on positive but plausible developments
2. **Bear Case (Pessimistic)**: The worst realistic scenario based on negative but plausible developments
3. **Base Case (Neutral)**: The most likely scenario assuming normal business operations

For each scenario provide:
- probability: Percentage (all three must sum to ~100%)
- priceTarget: Target as percentage range (e.g., "+15% to +25%" or "-10% to -18%")
- timeframe: Time horizon (e.g., "6-12 months")
- title: Short, punchy title
- summary: 3-4 sentences with concrete reasoning
- catalysts: Array of 3-4 key catalysts
- risks: Array of 2-3 main risks for this scenario

Additionally provide:
- confidence: Your confidence in this analysis (0-100)
- reasoning: Brief explanation of your methodology

CRITICAL: Respond ONLY with valid JSON, no markdown formatting or additional text.`;

interface CompanyInfo {
  name: string;
  sector: string;
  industry?: string;
  marketCap: string;
}

interface OptionsData {
  putCallRatio: number;
  ivRank: number;
  oiTrend: 'bullish' | 'bearish' | 'neutral';
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toString();
}

function buildUserPrompt(
  symbol: string,
  quote: StockQuote,
  technicals: TechnicalIndicators,
  aggregateScore: AggregateScore,
  news: NewsItem[],
  options?: OptionsData,
  companyInfo?: CompanyInfo
): string {
  const optionsSection = options
    ? `
═══════════════════════════════════════════════════════════════
OPTIONS DATA
═══════════════════════════════════════════════════════════════
- Put/Call Ratio: ${options.putCallRatio.toFixed(2)}
- IV Rank: ${options.ivRank}%
- Open Interest Trend: ${options.oiTrend}
`
    : '';

  const companySection = companyInfo
    ? `
═══════════════════════════════════════════════════════════════
COMPANY PROFILE
═══════════════════════════════════════════════════════════════
- Sector: ${companyInfo.sector}
- Industry: ${companyInfo.industry || 'Unknown'}
- Market Cap: ${companyInfo.marketCap}
`
    : '';

  return `
Analyze **${symbol}** (${companyInfo?.name || 'Unknown'})

═══════════════════════════════════════════════════════════════
PRICE DATA
═══════════════════════════════════════════════════════════════
- Current Price: $${quote.price.toFixed(2)}
- Daily Change: ${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)
- Day Range: $${quote.low.toFixed(2)} - $${quote.high.toFixed(2)}
- Volume: ${formatVolume(quote.volume)}

═══════════════════════════════════════════════════════════════
TECHNICAL ANALYSIS (Pre-computed)
═══════════════════════════════════════════════════════════════
Aggregate Signal: ${aggregateScore.label} (${aggregateScore.percentage}% bullish)

Individual Signals:
- RSI(14): ${technicals.rsi.toFixed(1)} → ${technicals.rsiSignal}
- MACD: ${technicals.macd.toFixed(3)} (Signal: ${technicals.macdSignal.toFixed(3)}) → ${technicals.macdTrend}
- Price vs SMA20: ${technicals.sma20Above ? 'Above' : 'Below'} ($${technicals.sma20.toFixed(2)})
- Price vs SMA50: ${technicals.sma50Above ? 'Above' : 'Below'} ($${technicals.sma50.toFixed(2)})
- Volume vs Avg: ${aggregateScore.percentage >= 50 ? 'Above average' : 'Normal'}
${optionsSection}
═══════════════════════════════════════════════════════════════
RECENT NEWS
═══════════════════════════════════════════════════════════════
${
  news.length > 0
    ? news
        .slice(0, 5)
        .map((n, i) => `${i + 1}. ${n.headline} [${n.sentiment}]`)
        .join('\n')
    : 'No recent news available.'
}
${companySection}
═══════════════════════════════════════════════════════════════

Generate the three scenarios as a JSON object with the following structure:
{
  "bull": { "probability": number, "priceTarget": string, "timeframe": string, "title": string, "summary": string, "catalysts": string[], "risks": string[] },
  "bear": { "probability": number, "priceTarget": string, "timeframe": string, "title": string, "summary": string, "catalysts": string[], "risks": string[] },
  "base": { "probability": number, "priceTarget": string, "timeframe": string, "title": string, "summary": string, "catalysts": string[], "risks": string[] },
  "confidence": number,
  "reasoning": string
}
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export interface GenerateScenariosParams {
  symbol: string;
  quote: StockQuote;
  technicals: TechnicalIndicators;
  aggregateScore: AggregateScore;
  news: NewsItem[];
  apiKey: string;
  options?: OptionsData;
  companyInfo?: CompanyInfo;
}

export async function generateScenarios(
  params: GenerateScenariosParams
): Promise<DeepDiveResult> {
  const {
    symbol,
    quote,
    technicals,
    aggregateScore,
    news,
    apiKey,
    options,
    companyInfo,
  } = params;

  // Initialize Anthropic client
  // Note: dangerouslyAllowBrowser is needed for client-side usage
  // In production, consider proxying through a backend
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const userPrompt = buildUserPrompt(
    symbol,
    quote,
    technicals,
    aggregateScore,
    news,
    options,
    companyInfo
  );

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Extract text content
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response received from Claude');
    }

    // Parse JSON from response
    const jsonText = textContent.text.trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize probabilities
    const totalProb =
      parsed.bull.probability + parsed.bear.probability + parsed.base.probability;
    if (totalProb < 90 || totalProb > 110) {
      // Normalize to 100%
      const factor = 100 / totalProb;
      parsed.bull.probability = Math.round(parsed.bull.probability * factor);
      parsed.bear.probability = Math.round(parsed.bear.probability * factor);
      parsed.base.probability =
        100 - parsed.bull.probability - parsed.bear.probability;
    }

    // Calculate token usage and cost
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    const cost =
      (inputTokens / 1000) * INPUT_COST_PER_1K +
      (outputTokens / 1000) * OUTPUT_COST_PER_1K;

    // Build result
    const result: DeepDiveResult = {
      timestamp: new Date().toISOString(),
      type: 'deep',
      symbol,
      scenarios: {
        bull: normalizeScenario(parsed.bull, 'Bull Case'),
        bear: normalizeScenario(parsed.bear, 'Bear Case'),
        base: normalizeScenario(parsed.base, 'Base Case'),
      },
      sentiment: {
        news: determineSentiment(news),
        social: 'mixed', // Would need social API
        options: 'balanced', // Would need options API
      },
      confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
      reasoning:
        parsed.reasoning ||
        'Analysis based on technical indicators and current market data.',
      tokenUsage: {
        input: inputTokens,
        output: outputTokens,
        cost: Math.round(cost * 10000) / 10000, // Round to 4 decimal places
      },
    };

    return result;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        throw new Error(
          'Invalid API key. Please check your Anthropic API key in settings.'
        );
      }
      if (error.status === 429) {
        throw new Error(
          'API rate limit reached. Please wait a moment and try again.'
        );
      }
      if (error.status === 500) {
        throw new Error(
          'Anthropic server temporarily unavailable. Please try again later.'
        );
      }
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY FUNCTION (for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════

export async function generateScenariosLegacy(
  symbol: string,
  quote: StockQuote,
  technicals: TechnicalIndicators,
  news: NewsItem[],
  apiKey: string,
  companyInfo?: { name: string; sector: string; marketCap: string }
): Promise<DeepDiveResult> {
  // Create a default aggregate score for legacy calls
  const defaultAggregateScore: AggregateScore = {
    bullishCount: 0,
    bearishCount: 0,
    neutralCount: 0,
    total: 0,
    percentage: 50,
    sentiment: 'neutral',
    glowEffect: null,
    label: 'Neutral',
  };

  return generateScenarios({
    symbol,
    quote,
    technicals,
    aggregateScore: defaultAggregateScore,
    news,
    apiKey,
    companyInfo,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Decode unicode escape sequences that weren't properly decoded
 * Handles cases like "\u2022" appearing as literal text instead of "•"
 */
function decodeUnicodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function normalizeScenario(raw: unknown, defaultTitle: string): Scenario {
  const scenario = raw as Record<string, unknown>;
  return {
    probability:
      typeof scenario.probability === 'number' ? scenario.probability : 33,
    priceTarget:
      typeof scenario.priceTarget === 'string' ? decodeUnicodeEscapes(scenario.priceTarget) : 'N/A',
    timeframe:
      typeof scenario.timeframe === 'string'
        ? decodeUnicodeEscapes(scenario.timeframe)
        : '6-12 months',
    title: typeof scenario.title === 'string' ? decodeUnicodeEscapes(scenario.title) : defaultTitle,
    summary:
      typeof scenario.summary === 'string'
        ? decodeUnicodeEscapes(scenario.summary)
        : 'No summary available.',
    catalysts: Array.isArray(scenario.catalysts)
      ? (scenario.catalysts as string[]).slice(0, 4).map(c => decodeUnicodeEscapes(c))
      : [],
    risks: Array.isArray(scenario.risks)
      ? (scenario.risks as string[]).slice(0, 3).map(r => decodeUnicodeEscapes(r))
      : [],
  };
}

function determineSentiment(
  news: NewsItem[]
): 'positive' | 'neutral' | 'negative' {
  if (news.length === 0) return 'neutral';

  const scores = news.map((n) => {
    switch (n.sentiment) {
      case 'positive':
        return 1;
      case 'negative':
        return -1;
      default:
        return 0;
    }
  });

  const avg = scores.reduce<number>((a, b) => a + b, 0) / scores.length;

  if (avg > 0.3) return 'positive';
  if (avg < -0.3) return 'negative';
  return 'neutral';
}

// ═══════════════════════════════════════════════════════════════════════════
// COST ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════

export function estimateAnalysisCost(): {
  min: number;
  max: number;
  avg: number;
} {
  // Based on typical prompt and response sizes
  const avgInputTokens = 1200;
  const avgOutputTokens = 1500;

  const avgCost =
    (avgInputTokens / 1000) * INPUT_COST_PER_1K +
    (avgOutputTokens / 1000) * OUTPUT_COST_PER_1K;

  return {
    min: avgCost * 0.7,
    max: avgCost * 1.5,
    avg: avgCost,
  };
}

export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return '< $0.001';
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(3)}`;
}

export function getTokenCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1000) * INPUT_COST_PER_1K +
    (outputTokens / 1000) * OUTPUT_COST_PER_1K
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MULTI-AI MASTER SYNTHESIZER
// ═══════════════════════════════════════════════════════════════════════════

import type {
  AggregatedIntelligence,
  IntelligenceSource,
} from '@/types/intelligence';

/**
 * Master System Prompt for Multi-Source Synthesis
 *
 * Claude acts as the "Master Analyst" synthesizing intelligence
 * from multiple specialized sources.
 */
const MASTER_SYSTEM_PROMPT = `You are the Master Analyst at SpectraScope, synthesizing intelligence from multiple AI sources into coherent investment scenarios.

You are the central "brain" that receives intelligence gathered from specialized AI sources:

INTELLIGENCE SOURCES:
━━━━━━━━━━━━━━━━━━━━━
• Technical Analysis (always present, computed client-side)
  → RSI, MACD, Moving Averages, Volume, Support/Resistance

• News Sentiment (NewsAPI/MediaStack - if available)
  → Recent headlines, news sentiment breakdown, key events

• Social Sentiment (Grok/xAI analyzing X/Twitter - if available)
  → Retail vs institutional interest, trending status, key takes from X

• Web Research (Gemini analyzing analyst data - if available)
  → Analyst consensus, price targets, competitive position, key findings

• Options Flow (Polygon - if available)
  → Put/Call ratio, unusual activity, institutional positioning

YOUR RESPONSIBILITIES:

1. WEIGH sources appropriately:
   - Technical analysis: Reliable for timing signals (weight: 25%)
   - News sentiment: Reliable for catalysts and events (weight: 25%)
   - Social sentiment: Gauge retail interest - can be noisy (weight: 15%)
   - Web research: Context, analyst opinions, fundamentals (weight: 20%)
   - Options flow: Smart money positioning (weight: 15%)

2. IDENTIFY conflicts between sources and explain them:
   Example: "Grok reports euphoric social sentiment (+0.8) while RSI shows overbought (78).
   This divergence suggests potential near-term pullback despite retail enthusiasm."

3. ATTRIBUTE insights to their AI sources:
   Example: "According to Grok's X/Twitter analysis...", "Gemini's research indicates...",
   "Technical indicators suggest...", "NewsAPI headlines show..."

4. ADJUST confidence based on available sources:
   - All 5 sources: High confidence possible (80-95)
   - 3-4 sources: Medium-high confidence (65-85)
   - 2 sources: Medium confidence (50-70)
   - Technical only: Lower confidence (40-60), note limitations

5. NOTE data limitations in your reasoning:
   If sources are missing, acknowledge what analysis is limited by.

6. PROVIDE a "bottomLine" summary (5-10 sentences):
   - Conversational, investor-friendly language
   - Clear recommendation context (not advice)
   - Key factors to watch
   - What would change your view
   - Time horizon considerations

7. RATE each source's sentiment (bullish/bearish/neutral) on a 1-10 scale:
   - 1-3: Bearish (negative indicators, risks, downtrends)
   - 4-5: Slightly Bearish to Neutral
   - 5: Neutral (mixed signals)
   - 6-7: Slightly Bullish
   - 8-10: Bullish (positive indicators, catalysts, uptrends)

OUTPUT FORMAT: Valid JSON only, no markdown formatting.

JSON Structure:
{
  "bull": { "probability": number, "priceTarget": string, "timeframe": string, "title": string, "summary": string, "catalysts": string[], "risks": string[] },
  "bear": { "probability": number, "priceTarget": string, "timeframe": string, "title": string, "summary": string, "catalysts": string[], "risks": string[] },
  "base": { "probability": number, "priceTarget": string, "timeframe": string, "title": string, "summary": string, "catalysts": string[], "risks": string[] },
  "confidence": number,
  "reasoning": string,
  "sourcesUsed": string[],
  "bottomLine": string,
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "overallScore": number,
  "sourceAssessments": [
    {
      "source": "Technical Analysis",
      "sentiment": "bullish" | "bearish" | "neutral",
      "score": number,
      "reason": "one sentence why"
    }
  ]
}

Only include sources in sourceAssessments that actually provided data.`;

/**
 * Build multi-source prompt from aggregated intelligence
 */
function buildMultiSourcePrompt(intelligence: AggregatedIntelligence): string {
  const { symbol, companyName, reports, availableSources, missingSources } = intelligence;

  let prompt = `Analyze **${symbol}**${companyName ? ` (${companyName})` : ''} using the following intelligence:\n\n`;

  prompt += `═══════════════════════════════════════════════════════════════\n`;
  prompt += `DATA AVAILABILITY\n`;
  prompt += `═══════════════════════════════════════════════════════════════\n`;
  prompt += `Available Sources: ${availableSources.map(s => getSourceDisplayNameLocal(s)).join(', ')}\n`;
  prompt += `Missing Sources: ${missingSources.length > 0 ? missingSources.map(s => getSourceDisplayNameLocal(s)).join(', ') : 'None'}\n`;
  prompt += `Data Quality: ${intelligence.dataQuality.label} (${intelligence.dataQuality.score}%)\n\n`;

  // Add each report
  for (const report of reports) {
    prompt += `═══════════════════════════════════════════════════════════════\n`;
    prompt += `SOURCE: ${getSourceDisplayNameLocal(report.source).toUpperCase()}\n`;
    prompt += `═══════════════════════════════════════════════════════════════\n`;
    prompt += `Confidence: ${report.confidence}%\n`;
    prompt += `Summary: ${report.summary}\n\n`;
    prompt += `Data:\n${JSON.stringify(report.data, null, 2)}\n\n`;
  }

  prompt += `═══════════════════════════════════════════════════════════════\n`;
  prompt += `TASK\n`;
  prompt += `═══════════════════════════════════════════════════════════════\n`;
  prompt += `Generate Bull/Bear/Base scenarios as JSON.\n`;
  prompt += `- Weigh each source appropriately\n`;
  prompt += `- Note conflicts between sources\n`;
  prompt += `- Attribute key insights to their sources\n`;
  prompt += `- Adjust confidence based on data completeness\n`;

  return prompt;
}

/**
 * Local helper to avoid circular import
 */
function getSourceDisplayNameLocal(source: IntelligenceSource): string {
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
 * Synthesize scenarios from multi-source intelligence
 *
 * This is the main function for the Multi-AI architecture where
 * Claude acts as the Master Synthesizer.
 */
export async function synthesizeFromIntelligence(
  intelligence: AggregatedIntelligence,
  apiKey: string
): Promise<DeepDiveResult> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const userPrompt = buildMultiSourcePrompt(intelligence);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: MASTER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Extract text content
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response received from Claude');
    }

    // Parse JSON from response
    const jsonText = textContent.text.trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize probabilities
    const totalProb =
      parsed.bull.probability + parsed.bear.probability + parsed.base.probability;
    if (totalProb < 90 || totalProb > 110) {
      const factor = 100 / totalProb;
      parsed.bull.probability = Math.round(parsed.bull.probability * factor);
      parsed.bear.probability = Math.round(parsed.bear.probability * factor);
      parsed.base.probability =
        100 - parsed.bull.probability - parsed.bear.probability;
    }

    // Calculate token usage and cost
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    const cost = getTokenCost(inputTokens, outputTokens);

    // Determine sentiment from reports
    const newsReport = intelligence.reports.find(r => r.source === 'news-sentiment');
    const newsSentiment = newsReport?.data?.overallSentiment || 'neutral';

    const socialReport = intelligence.reports.find(r => r.source === 'social-sentiment');
    const socialScore = (socialReport?.data as { sentimentScore?: number } | undefined)?.sentimentScore ?? 0;
    const socialSentiment = socialScore > 0.2
      ? 'bullish'
      : socialScore < -0.2
        ? 'bearish'
        : 'mixed';

    const optionsReport = intelligence.reports.find(r => r.source === 'options-flow');
    const optionsFlow = optionsReport?.data?.institutionalFlow || 'balanced';

    // Normalize source assessments
    const sourceAssessments = Array.isArray(parsed.sourceAssessments)
      ? parsed.sourceAssessments.map((a: Record<string, unknown>) => ({
          source: typeof a.source === 'string' ? a.source : 'Unknown',
          sentiment: ['bullish', 'bearish', 'neutral'].includes(a.sentiment as string)
            ? (a.sentiment as 'bullish' | 'bearish' | 'neutral')
            : 'neutral',
          score: typeof a.score === 'number' ? Math.min(10, Math.max(1, a.score)) : 5,
          reason: typeof a.reason === 'string' ? a.reason : '',
        }))
      : [];

    // Build result
    const result: DeepDiveResult = {
      timestamp: new Date().toISOString(),
      type: 'deep',
      symbol: intelligence.symbol,
      scenarios: {
        bull: normalizeScenarioMulti(parsed.bull, 'Bull Case'),
        bear: normalizeScenarioMulti(parsed.bear, 'Bear Case'),
        base: normalizeScenarioMulti(parsed.base, 'Base Case'),
      },
      sentiment: {
        news: newsSentiment as 'positive' | 'neutral' | 'negative',
        social: socialSentiment as 'bullish' | 'mixed' | 'bearish',
        options: optionsFlow as 'call-heavy' | 'balanced' | 'put-heavy',
      },
      confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
      reasoning: decodeUnicodeEscapes(parsed.reasoning || 'Analysis synthesized from available intelligence sources.'),
      bottomLine: decodeUnicodeEscapes(parsed.bottomLine || 'Review the scenarios above for a comprehensive view of potential outcomes.'),
      overallSentiment: ['bullish', 'bearish', 'neutral'].includes(parsed.overallSentiment)
        ? parsed.overallSentiment
        : 'neutral',
      overallScore: typeof parsed.overallScore === 'number'
        ? Math.min(10, Math.max(1, parsed.overallScore))
        : 5,
      sourceAssessments,
      tokenUsage: {
        input: inputTokens,
        output: outputTokens,
        cost: Math.round(cost * 10000) / 10000,
      },
    };

    return result;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        throw new Error('Invalid API key. Please check your Anthropic API key in settings.');
      }
      if (error.status === 429) {
        throw new Error('API rate limit reached. Please wait a moment and try again.');
      }
      if (error.status === 500) {
        throw new Error('Anthropic server temporarily unavailable. Please try again later.');
      }
    }
    throw error;
  }
}

function normalizeScenarioMulti(raw: unknown, defaultTitle: string): Scenario {
  const scenario = raw as Record<string, unknown>;
  return {
    probability: typeof scenario.probability === 'number' ? scenario.probability : 33,
    priceTarget: typeof scenario.priceTarget === 'string' ? decodeUnicodeEscapes(scenario.priceTarget) : 'N/A',
    timeframe: typeof scenario.timeframe === 'string' ? decodeUnicodeEscapes(scenario.timeframe) : '6-12 months',
    title: typeof scenario.title === 'string' ? decodeUnicodeEscapes(scenario.title) : defaultTitle,
    summary: typeof scenario.summary === 'string' ? decodeUnicodeEscapes(scenario.summary) : 'No summary available.',
    catalysts: Array.isArray(scenario.catalysts)
      ? (scenario.catalysts as string[]).slice(0, 4).map(c => decodeUnicodeEscapes(c))
      : [],
    risks: Array.isArray(scenario.risks)
      ? (scenario.risks as string[]).slice(0, 3).map(r => decodeUnicodeEscapes(r))
      : [],
  };
}
