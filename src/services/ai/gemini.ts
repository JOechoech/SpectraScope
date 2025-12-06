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
  timestamp: string;
}

export async function getGeminiResearch(
  symbol: string,
  companyName: string,
  currentPrice: number,
  apiKey: string
): Promise<GeminiResearchResult | null> {
  if (!apiKey) {
    console.log('Gemini API key not configured');
    return null;
  }

  try {
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
                  text: `You are a financial research analyst. Analyze ${symbol} (${companyName}), currently trading at $${currentPrice.toFixed(2)}.

Provide your analysis as JSON only:

{
  "research": {
    "analystConsensus": "<strong-buy|buy|hold|sell|strong-sell>",
    "averagePriceTarget": <number or null>,
    "priceTargetRange": { "low": <number>, "high": <number> } or null
  },
  "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "recentDevelopments": ["<development 1>", "<development 2>"],
  "competitivePosition": "<brief assessment>",
  "risks": ["<risk 1>", "<risk 2>"],
  "opportunities": ["<opportunity 1>", "<opportunity 2>"]
}

Focus on:
- Recent analyst ratings and price targets
- Key business developments in last 30 days
- Competitive positioning
- Main risks and opportunities

Return ONLY valid JSON, no markdown or explanation.`,
                },
              ],
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

    return {
      symbol,
      research: result.research,
      keyFindings: result.keyFindings || [],
      recentDevelopments: result.recentDevelopments || [],
      competitivePosition: result.competitivePosition || 'Unknown',
      risks: result.risks || [],
      opportunities: result.opportunities || [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
}

export function formatGeminiForClaude(result: GeminiResearchResult): string {
  return `
## Web Research & Analyst Data (via Gemini)

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
`;
}
