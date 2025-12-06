/**
 * Grok (xAI) Integration
 * https://docs.x.ai/api
 *
 * Grok has unique access to LIVE X/Twitter data.
 * We use it specifically for real-time social sentiment analysis.
 * Grok can access posts from the last 7 days in real-time.
 */

const BASE_URL = 'https://api.x.ai/v1';

// Get today's date and 7 days ago for explicit date range
function getDateRange(): { today: string; sevenDaysAgo: string; isoToday: string; isoSevenDaysAgo: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const formatEU = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatISO = (d: Date) => d.toISOString().split('T')[0];

  return {
    today: formatEU(now),
    sevenDaysAgo: formatEU(sevenDaysAgo),
    isoToday: formatISO(now),
    isoSevenDaysAgo: formatISO(sevenDaysAgo),
  };
}

export interface SocialSentimentResult {
  symbol: string;
  sentiment: {
    score: number; // -1 to 1
    label: 'bullish' | 'neutral' | 'bearish';
    confidence: number; // 0-100
  };
  metrics: {
    mentionCount: number;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
    trending: boolean;
    buzzLevel: 'low' | 'medium' | 'high' | 'viral';
  };
  topTakes: Array<{
    text: string;
    engagement: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    date?: string;
  }>;
  retailVsInstitutional: 'retail-heavy' | 'mixed' | 'institutional';
  dateRange: string;
  timestamp: string;
}

/**
 * Get X/Twitter sentiment with optional custom prompt from orchestrator
 *
 * @param symbol - Stock symbol
 * @param companyName - Company name
 * @param apiKey - Grok API key
 * @param customPrompt - Optional custom prompt from Claude Opus orchestrator
 */
export async function getXSentiment(
  symbol: string,
  companyName: string,
  apiKey: string,
  customPrompt?: string
): Promise<SocialSentimentResult | null> {
  if (!apiKey) {
    console.log('Grok API key not configured');
    return null;
  }

  try {
    const dates = getDateRange();

    // Use custom prompt if provided, otherwise use default
    const userPromptContent = customPrompt
      ? `${customPrompt}

IMPORTANT RULES:
- Only report data from the LAST 7 DAYS (${dates.sevenDaysAgo} to ${dates.today})
- Include dates for all mentions found
- If no mentions found, say "Low social volume - minimal X/Twitter discussion"
- DO NOT fabricate data
- Return sentiment: bullish/bearish/neutral with confidence %

OUTPUT FORMAT:
{
  "sentiment": {
    "score": <number -1 to 1>,
    "label": "<bullish|neutral|bearish>",
    "confidence": <number 0-100>
  },
  "metrics": {
    "mentionCount": <estimated mentions in last 7 days>,
    "sentimentBreakdown": { "positive": <n>, "neutral": <n>, "negative": <n> },
    "trending": <boolean>,
    "buzzLevel": "<low|medium|high|viral>"
  },
  "topTakes": [
    { "text": "<post content>", "engagement": <number>, "sentiment": "<positive|neutral|negative>", "date": "<YYYY-MM-DD>" }
  ],
  "retailVsInstitutional": "<retail-heavy|mixed|institutional>",
  "dateRange": "${dates.sevenDaysAgo} to ${dates.today}"
}`
      : `Find X/Twitter posts about $${symbol} (${companyName}) from the LAST 7 DAYS ONLY (${dates.sevenDaysAgo} to ${dates.today}).

What are people saying about this stock RIGHT NOW in ${dates.today.split('.')[1]}/${dates.today.split('.')[2]}?

If there are no recent posts, return mentionCount: 0 and empty topTakes.`;

    // Grok API for chat completions with X context
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          {
            role: 'system',
            content: `You are a social media sentiment analyst with LIVE access to X/Twitter data.

TODAY'S DATE: ${dates.today} (${dates.isoToday})

CRITICAL RULES:
1. Only analyze posts from ${dates.isoSevenDaysAgo} to ${dates.isoToday}
2. If you cannot find recent posts, say "No recent mentions found"
3. Do NOT use training data or old posts
4. All dates in topTakes must be between ${dates.isoSevenDaysAgo} and ${dates.isoToday}

Return ONLY valid JSON:
{
  "sentiment": {
    "score": <number -1 to 1>,
    "label": "<bullish|neutral|bearish>",
    "confidence": <number 0-100>
  },
  "metrics": {
    "mentionCount": <estimated mentions in last 7 days>,
    "sentimentBreakdown": { "positive": <n>, "neutral": <n>, "negative": <n> },
    "trending": <boolean>,
    "buzzLevel": "<low|medium|high|viral>"
  },
  "topTakes": [
    { "text": "<post content>", "engagement": <number>, "sentiment": "<positive|neutral|negative>", "date": "<YYYY-MM-DD>" }
  ],
  "retailVsInstitutional": "<retail-heavy|mixed|institutional>",
  "dateRange": "${dates.sevenDaysAgo} to ${dates.today}"
}`,
          },
          {
            role: 'user',
            content: userPromptContent,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Grok API error:', error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Empty response from Grok');
      return null;
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse JSON from Grok response');
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      symbol,
      sentiment: result.sentiment,
      metrics: result.metrics,
      topTakes: result.topTakes || [],
      retailVsInstitutional: result.retailVsInstitutional || 'mixed',
      dateRange: result.dateRange || `${dates.sevenDaysAgo} to ${dates.today}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Grok API error:', error);
    return null;
  }
}

export function formatGrokForClaude(result: SocialSentimentResult): string {
  return `
## X/Twitter Social Sentiment (via Grok - LIVE DATA)

**Data Range:** ${result.dateRange}
**Overall Sentiment:** ${result.sentiment.label.toUpperCase()} (score: ${result.sentiment.score.toFixed(2)}, confidence: ${result.sentiment.confidence}%)

**Metrics (Last 7 Days):**
- Mention Volume: ~${result.metrics.mentionCount.toLocaleString()} posts
- Buzz Level: ${result.metrics.buzzLevel}
- Trending NOW: ${result.metrics.trending ? '🔥 YES' : 'No'}
- Audience: ${result.retailVsInstitutional}

**Sentiment Breakdown:**
- Positive: ${result.metrics.sentimentBreakdown.positive}%
- Neutral: ${result.metrics.sentimentBreakdown.neutral}%
- Negative: ${result.metrics.sentimentBreakdown.negative}%

**Recent Posts from X (with dates):**
${result.topTakes
  .slice(0, 3)
  .map((t, i) => `${i + 1}. "${t.text}"${t.date ? ` (${t.date})` : ''} [${t.sentiment}]`)
  .join('\n')}
`;
}
