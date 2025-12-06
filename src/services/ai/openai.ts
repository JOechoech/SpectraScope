/**
 * OpenAI API Service
 *
 * Uses GPT-5-mini for fast, cost-efficient news analysis.
 * Searches for and summarizes latest news about stocks.
 */

const BASE_URL = 'https://api.openai.com/v1';

export interface OpenAINewsResult {
  symbol: string;
  headlines: Array<{
    title: string;
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    source?: string;
  }>;
  overallSentiment: 'bullish' | 'neutral' | 'bearish';
  sentimentScore: number; // -1 to 1
  keyTopics: string[];
  marketImpact: string;
  timestamp: string;
}

export async function getOpenAINewsAnalysis(
  symbol: string,
  companyName: string,
  apiKey: string
): Promise<OpenAINewsResult | null> {
  if (!apiKey) {
    console.log('OpenAI API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a financial news analyst. Search for and summarize the latest news about a stock.
Return ONLY valid JSON in this format:
{
  "headlines": [
    { "title": "headline text", "summary": "brief summary", "sentiment": "positive|neutral|negative", "source": "optional source" }
  ],
  "overallSentiment": "bullish|neutral|bearish",
  "sentimentScore": <number -1 to 1>,
  "keyTopics": ["topic1", "topic2"],
  "marketImpact": "brief assessment of potential market impact"
}

Focus on:
- Recent news from the last 24-48 hours
- Earnings, guidance, analyst ratings
- Product launches, partnerships, legal issues
- Industry trends affecting the stock
- Provide 3-5 key headlines with summaries`,
          },
          {
            role: 'user',
            content: `Search for and summarize the latest news about ${symbol} (${companyName}). What are the key headlines and overall sentiment?`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Empty response from OpenAI');
      return null;
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse JSON from OpenAI response');
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      symbol,
      headlines: result.headlines || [],
      overallSentiment: result.overallSentiment || 'neutral',
      sentimentScore: result.sentimentScore || 0,
      keyTopics: result.keyTopics || [],
      marketImpact: result.marketImpact || 'Unknown impact',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}

export function formatOpenAIForClaude(result: OpenAINewsResult): string {
  return `
## Latest News Analysis (via OpenAI)

**Overall Sentiment:** ${result.overallSentiment.toUpperCase()} (score: ${result.sentimentScore.toFixed(2)})

**Key Headlines:**
${result.headlines
  .slice(0, 5)
  .map((h, i) => `${i + 1}. ${h.title} [${h.sentiment}]\n   ${h.summary}`)
  .join('\n')}

**Key Topics:** ${result.keyTopics.join(', ')}

**Market Impact:** ${result.marketImpact}
`;
}
