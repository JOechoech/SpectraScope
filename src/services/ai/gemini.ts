/**
 * Google Gemini Integration
 * https://ai.google.dev/docs
 *
 * Gemini excels at web-grounded research and factual analysis.
 * We use it for analyst opinions, company research, and market context.
 */

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiResearchResult {
  symbol: string;
  research: {
    analystConsensus: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
    averagePriceTarget: number | null;
    priceTargetRange: { low: number; high: number } | null;
  };
  keyFindings: string[];
  recentDevelopments: string[];
  competitivePosition: string;
  risks: string[];
  opportunities: string[];
  sources: Array<{ title: string; date: string; url?: string }>;
  groundingMetadata?: {
    searchQueries: string[];
    webSources: Array<{ uri: string; title: string }>;
  };
  timestamp: string;
}

/**
 * Get Gemini research with optional custom prompt from orchestrator
 *
 * @param symbol - Stock symbol
 * @param companyName - Company name
 * @param currentPrice - Current stock price
 * @param apiKey - Gemini API key
 * @param customPrompt - Optional custom prompt from Claude Opus orchestrator
 */
export async function getGeminiResearch(
  symbol: string,
  companyName: string,
  currentPrice: number,
  apiKey: string,
  customPrompt?: string
): Promise<GeminiResearchResult | null> {
  if (!apiKey) {
    console.log('Gemini API key not configured');
    return null;
  }

  try {
    // Build the prompt - use custom if provided
    const researchPrompt = customPrompt
      ? `${customPrompt}

You are a financial research analyst with access to LIVE WEB DATA. Analyze ${symbol} (${companyName}), currently trading at $${currentPrice.toFixed(2)}.

IMPORTANT: Use Google Search to find CURRENT, REAL-TIME information from the last 14 days.

OUTPUT FORMAT (JSON only):
{
  "research": {
    "analystConsensus": "<strong-buy|buy|hold|sell|strong-sell>",
    "averagePriceTarget": <number or null>,
    "priceTargetRange": { "low": <number>, "high": <number> } or null
  },
  "keyFindings": ["<finding 1 with date>", "<finding 2 with date>", "<finding 3 with date>"],
  "recentDevelopments": ["<development 1 with date>", "<development 2 with date>"],
  "competitivePosition": "<brief assessment>",
  "risks": ["<risk 1>", "<risk 2>"],
  "opportunities": ["<opportunity 1>", "<opportunity 2>"],
  "sources": [
    { "title": "<article title>", "date": "<YYYY-MM-DD>", "url": "<url if available>" }
  ]
}

CRITICAL: Include specific dates for all findings.`
      : `You are a financial research analyst with access to LIVE WEB DATA. Analyze ${symbol} (${companyName}), currently trading at $${currentPrice.toFixed(2)}.

IMPORTANT: Use Google Search to find CURRENT, REAL-TIME information. Do NOT rely on training data.

Provide your analysis as JSON only:

{
  "research": {
    "analystConsensus": "<strong-buy|buy|hold|sell|strong-sell>",
    "averagePriceTarget": <number or null>,
    "priceTargetRange": { "low": <number>, "high": <number> } or null
  },
  "keyFindings": ["<finding 1 with date>", "<finding 2 with date>", "<finding 3 with date>"],
  "recentDevelopments": ["<development 1 with date>", "<development 2 with date>"],
  "competitivePosition": "<brief assessment>",
  "risks": ["<risk 1>", "<risk 2>"],
  "opportunities": ["<opportunity 1>", "<opportunity 2>"],
  "sources": [
    { "title": "<article title>", "date": "<YYYY-MM-DD>", "url": "<url if available>" }
  ]
}

Focus on:
- Recent analyst ratings and price targets from the LAST 7 DAYS
- Key business developments in the LAST 7 DAYS (include dates!)
- Latest earnings, guidance, or news
- Competitive positioning
- Main risks and opportunities

CRITICAL: Include specific dates for all findings. Return ONLY valid JSON, no markdown.`;

    const response = await fetch(
      `${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: researchPrompt,
                },
              ],
            },
          ],
          // Enable Google Search grounding for LIVE web data
          tools: [
            {
              googleSearch: {},
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      return null;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error('Empty response from Gemini');
      return null;
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse JSON from Gemini response');
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);

    // Extract grounding metadata from response (Google Search sources)
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    const webSources: Array<{ uri: string; title: string }> = [];

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web) {
          webSources.push({
            uri: chunk.web.uri || '',
            title: chunk.web.title || 'Source',
          });
        }
      }
    }

    // Combine AI-provided sources with grounding sources
    const aiSources = result.sources || [];
    const allSources = [
      ...aiSources,
      ...webSources.map(s => ({
        title: s.title,
        date: new Date().toISOString().split('T')[0],
        url: s.uri,
      })),
    ];

    return {
      symbol,
      research: result.research,
      keyFindings: result.keyFindings || [],
      recentDevelopments: result.recentDevelopments || [],
      competitivePosition: result.competitivePosition || 'Unknown',
      risks: result.risks || [],
      opportunities: result.opportunities || [],
      sources: allSources,
      groundingMetadata: webSources.length > 0 ? {
        searchQueries: groundingMetadata?.searchEntryPoint?.renderedContent ? ['web search'] : [],
        webSources,
      } : undefined,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
}

export function formatGeminiForClaude(result: GeminiResearchResult): string {
  const sourcesText = result.sources && result.sources.length > 0
    ? `\n**Sources (Live Web Search):**\n${result.sources.slice(0, 5).map(s =>
        `- ${s.title}${s.date ? ` (${s.date})` : ''}${s.url ? ` - ${s.url}` : ''}`
      ).join('\n')}`
    : '';

  return `
## Web Research & Analyst Data (via Gemini with Google Search)

**Analyst Consensus:** ${result.research.analystConsensus.toUpperCase()}
${result.research.averagePriceTarget ? `**Average Price Target:** $${result.research.averagePriceTarget}` : ''}
${result.research.priceTargetRange ? `**Target Range:** $${result.research.priceTargetRange.low} - $${result.research.priceTargetRange.high}` : ''}

**Key Findings:**
${result.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

**Recent Developments:**
${result.recentDevelopments.map((d) => `- ${d}`).join('\n')}

**Competitive Position:** ${result.competitivePosition}

**Opportunities:** ${result.opportunities.join(', ')}
**Risks:** ${result.risks.join(', ')}
${sourcesText}
`;
}
