/**
 * Grok (xAI) Integration
 * https://docs.x.ai/api
 *
 * Grok has unique access to X/Twitter data.
 * We use it specifically for social sentiment analysis.
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
  }>;
  retailVsInstitutional: 'retail-heavy' | 'mixed' | 'institutional';
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
            content: `You are a social media sentiment analyst with access to X/Twitter data.
Analyze the current sentiment around a stock and return ONLY valid JSON.

Output format:
{
  "sentiment": {
    "score": <number -1 to 1>,
    "label": "<bullish|neutral|bearish>",
    "confidence": <number 0-100>
  },
  "metrics": {
    "mentionCount": <estimated number>,
    "sentimentBreakdown": { "positive": <n>, "neutral": <n>, "negative": <n> },
    "trending": <boolean>,
    "buzzLevel": "<low|medium|high|viral>"
  },
  "topTakes": [
    { "text": "<key opinion>", "engagement": <number>, "sentiment": "<positive|neutral|negative>" }
  ],
  "retailVsInstitutional": "<retail-heavy|mixed|institutional>"
}`,
          },
          {
            role: 'user',
            content: `Analyze current X/Twitter sentiment for ${symbol} (${companyName}).
What are people saying? Is it trending? What's the retail vs institutional breakdown?
Consider posts from the last 24-48 hours.`,
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
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Grok API error:', error);
    return null;
  }
}

export function formatGrokForClaude(result: SocialSentimentResult): string {
  return `
## X/Twitter Social Sentiment (via Grok)

**Overall Sentiment:** ${result.sentiment.label.toUpperCase()} (score: ${result.sentiment.score.toFixed(2)}, confidence: ${result.sentiment.confidence}%)

**Metrics:**
- Mention Volume: ~${result.metrics.mentionCount.toLocaleString()} posts
- Buzz Level: ${result.metrics.buzzLevel}
- Trending: ${result.metrics.trending ? 'YES' : 'No'}
- Audience: ${result.retailVsInstitutional}

**Sentiment Breakdown:**
- Positive: ${result.metrics.sentimentBreakdown.positive}%
- Neutral: ${result.metrics.sentimentBreakdown.neutral}%
- Negative: ${result.metrics.sentimentBreakdown.negative}%

**Top Takes from X:**
${result.topTakes
  .slice(0, 3)
  .map((t, i) => `${i + 1}. "${t.text}" [${t.sentiment}]`)
  .join('\n')}
`;
}
