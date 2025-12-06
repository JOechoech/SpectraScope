/**
 * OpenAI API Service
 *
 * Uses GPT-4o-mini with web_search tool for LIVE news analysis.
 * Searches the web for latest stock news in real-time.
 */

const BASE_URL = 'https://api.openai.com/v1';

export interface OpenAINewsResult {
  symbol: string;
  headlines: Array<{
    title: string;
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    source?: string;
    date?: string;
    url?: string;
  }>;
  overallSentiment: 'bullish' | 'neutral' | 'bearish';
  sentimentScore: number; // -1 to 1
  keyTopics: string[];
  marketImpact: string;
  sources: Array<{ title: string; url: string; date?: string }>;
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
    // Use Responses API with web_search tool for LIVE data
    const response = await fetch(`${BASE_URL}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        // Enable web search tool for live data
        tools: [{ type: 'web_search' }],
        input: `You are a financial news analyst. Search the web for the LATEST news about ${symbol} (${companyName}).

IMPORTANT: Use web search to find REAL-TIME, CURRENT news. Do NOT rely on training data.

Focus on news from the LAST 7 DAYS only:
- Breaking news and announcements
- Earnings reports, guidance updates
- Analyst ratings and price target changes
- Product launches, partnerships, legal issues
- Regulatory news and market impact

Return ONLY valid JSON:
{
  "headlines": [
    { "title": "headline text", "summary": "brief summary", "sentiment": "positive|neutral|negative", "source": "source name", "date": "YYYY-MM-DD", "url": "article url" }
  ],
  "overallSentiment": "bullish|neutral|bearish",
  "sentimentScore": <number -1 to 1>,
  "keyTopics": ["topic1", "topic2"],
  "marketImpact": "brief assessment of potential market impact",
  "sources": [{ "title": "source title", "url": "url", "date": "YYYY-MM-DD" }]
}

Provide 3-5 key headlines with dates and sources. CRITICAL: Include actual dates for all news.`,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      // Fallback to chat completions if responses API fails
      return fallbackChatCompletion(symbol, companyName, apiKey);
    }

    const data = await response.json();

    // Extract content from Responses API format
    let content = '';
    const sources: Array<{ title: string; url: string; date?: string }> = [];

    // Responses API returns output array with different item types
    if (data.output) {
      for (const item of data.output) {
        if (item.type === 'message' && item.content) {
          for (const block of item.content) {
            if (block.type === 'output_text') {
              content = block.text;
            }
          }
        }
        // Extract web search citations
        if (item.type === 'web_search_call' && item.results) {
          for (const result of item.results) {
            sources.push({
              title: result.title || 'Source',
              url: result.url || '',
              date: result.date,
            });
          }
        }
      }
    }

    if (!content) {
      console.error('Empty response from OpenAI');
      return fallbackChatCompletion(symbol, companyName, apiKey);
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse JSON from OpenAI response');
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);

    // Combine AI-provided sources with web search sources
    const allSources = [...(result.sources || []), ...sources];

    return {
      symbol,
      headlines: result.headlines || [],
      overallSentiment: result.overallSentiment || 'neutral',
      sentimentScore: result.sentimentScore || 0,
      keyTopics: result.keyTopics || [],
      marketImpact: result.marketImpact || 'Unknown impact',
      sources: allSources,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}

// Fallback to chat completions if Responses API is unavailable
async function fallbackChatCompletion(
  symbol: string,
  companyName: string,
  apiKey: string
): Promise<OpenAINewsResult | null> {
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
            content: `You are a financial news analyst. Provide recent news analysis about stocks.
Return ONLY valid JSON with headlines, sentiment, and sources.`,
          },
          {
            role: 'user',
            content: `Analyze recent news about ${symbol} (${companyName}). Provide headlines, sentiment, and market impact.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);

    return {
      symbol,
      headlines: result.headlines || [],
      overallSentiment: result.overallSentiment || 'neutral',
      sentimentScore: result.sentimentScore || 0,
      keyTopics: result.keyTopics || [],
      marketImpact: result.marketImpact || 'Unknown impact',
      sources: [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('OpenAI fallback error:', error);
    return null;
  }
}

export function formatOpenAIForClaude(result: OpenAINewsResult): string {
  const sourcesText = result.sources && result.sources.length > 0
    ? `\n**Sources (Live Web Search):**\n${result.sources.slice(0, 5).map(s =>
        `- ${s.title}${s.date ? ` (${s.date})` : ''}${s.url ? ` - ${s.url}` : ''}`
      ).join('\n')}`
    : '';

  return `
## Latest News Analysis (via OpenAI with Web Search)

**Overall Sentiment:** ${result.overallSentiment.toUpperCase()} (score: ${result.sentimentScore.toFixed(2)})

**Key Headlines:**
${result.headlines
  .slice(0, 5)
  .map((h, i) => `${i + 1}. ${h.title}${h.date ? ` (${h.date})` : ''} [${h.sentiment}]\n   ${h.summary}${h.source ? ` - ${h.source}` : ''}`)
  .join('\n')}

**Key Topics:** ${result.keyTopics.join(', ')}

**Market Impact:** ${result.marketImpact}
${sourcesText}
`;
}
