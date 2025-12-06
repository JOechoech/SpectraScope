/**
 * Grok (xAI) Integration
 * https://docs.x.ai/api
 *
 * Grok has unique access to LIVE X/Twitter data.
 * We use it specifically for real-time social sentiment analysis.
 * Grok can access posts from the last 7 days in real-time.
 */

const BASE_URL = 'https://api.x.ai/v1';

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

export async function getXSentiment(
  symbol: string,
  companyName: string,
  apiKey: string
): Promise<SocialSentimentResult | null> {
  if (!apiKey) {
    console.log('Grok API key not configured');
    return null;
  }

  try {
    // Grok API for chat completions with X context
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        messages: [
          {
            role: 'system',
            content: `You are a social media sentiment analyst with LIVE access to X/Twitter data.

CRITICAL: You must analyze REAL, CURRENT posts from X. Use your live X data access.
Focus ONLY on posts from the LAST 7 DAYS. Do NOT use training data.

Analyze the current sentiment around a stock and return ONLY valid JSON.

Output format:
{
  "sentiment": {
    "score": <number -1 to 1>,
    "label": "<bullish|neutral|bearish>",
    "confidence": <number 0-100>
  },
  "metrics": {
    "mentionCount": <estimated number from last 7 days>,
    "sentimentBreakdown": { "positive": <n>, "neutral": <n>, "negative": <n> },
    "trending": <boolean - is it trending NOW>,
    "buzzLevel": "<low|medium|high|viral>"
  },
  "topTakes": [
    { "text": "<actual post content or paraphrase>", "engagement": <likes+retweets>, "sentiment": "<positive|neutral|negative>", "date": "<YYYY-MM-DD>" }
  ],
  "retailVsInstitutional": "<retail-heavy|mixed|institutional>",
  "dateRange": "<earliest date> to <latest date>"
}

IMPORTANT:
- Include REAL posts with dates from the last 7 days
- Note if there's unusual activity or volume spikes
- Identify if any influential accounts (fintwit, analysts) are posting`,
          },
          {
            role: 'user',
            content: `Analyze CURRENT X/Twitter sentiment for ${symbol} (${companyName}) from the LAST 7 DAYS.

Search for $${symbol} and ${companyName} on X. What are people saying RIGHT NOW?
- Is it trending?
- Any viral posts in the last 7 days?
- What's the retail vs institutional breakdown?
- Include actual post examples with dates.`,
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
      dateRange: result.dateRange || 'Last 7 days',
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
