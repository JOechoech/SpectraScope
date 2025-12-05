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
  NewsItem 
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2500;

// Token cost estimation (USD)
const INPUT_COST_PER_1K = 0.003;
const OUTPUT_COST_PER_1K = 0.015;

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `Du bist ein erfahrener Finanzanalyst mit Expertise in fundamentaler und technischer Analyse. Deine Analysen sind präzise, datengestützt und berücksichtigen sowohl quantitative als auch qualitative Faktoren.

Deine Aufgabe ist es, drei realistische Szenarien für eine Aktie zu erstellen:

1. **Bull Case (Optimistisch)**: Das beste realistische Szenario basierend auf positiven aber plausiblen Entwicklungen
2. **Bear Case (Pessimistisch)**: Das schlechteste realistische Szenario basierend auf negativen aber plausiblen Entwicklungen
3. **Base Case (Basis)**: Das wahrscheinlichste Szenario bei normalem Geschäftsverlauf

Für jedes Szenario liefere:
- probability: Wahrscheinlichkeit in % (alle drei müssen sich auf ~100% summieren)
- priceTarget: Preisziel als Prozent-Range (z.B. "+15% bis +25%" oder "-10% bis -18%")
- timeframe: Zeitrahmen (z.B. "6-12 Monate")
- title: Kurzer Titel (z.B. "Optimistisches Szenario")
- summary: Ausführliche Zusammenfassung (3-4 Sätze) mit konkreten Begründungen
- catalysts: Array von 3-4 Schlüssel-Katalysatoren
- risks: Array von 2-3 Hauptrisiken für dieses Szenario

Zusätzlich liefere:
- confidence: Deine Konfidenz in der Analyse (0-100)
- reasoning: Kurze Erläuterung deiner Methodik

WICHTIG: Antworte NUR mit validem JSON, ohne Markdown-Formatierung oder zusätzlichen Text.`;

function buildUserPrompt(
  symbol: string,
  quote: StockQuote,
  technicals: TechnicalIndicators,
  news: NewsItem[],
  companyInfo?: { name: string; sector: string; marketCap: string }
): string {
  const newsSection = news.length > 0
    ? `**Aktuelle Nachrichten:**
${news.slice(0, 5).map((n, i) => `${i + 1}. ${n.headline} (Sentiment: ${n.sentiment})`).join('\n')}`
    : '**Aktuelle Nachrichten:** Keine aktuellen Nachrichten verfügbar.';

  return `Analysiere die Aktie **${symbol}** (${companyInfo?.name || 'Unbekannt'}) und erstelle die drei Szenarien.

**Aktuelle Kursdaten:**
- Aktueller Kurs: $${quote.price.toFixed(2)}
- Tagesveränderung: ${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)
- Tageshoch: $${quote.high.toFixed(2)}
- Tagestief: $${quote.low.toFixed(2)}
- Volumen: ${(quote.volume / 1000000).toFixed(2)}M

**Technische Indikatoren:**
- RSI (14): ${technicals.rsi.toFixed(1)} (${technicals.rsiSignal})
- MACD: ${technicals.macd.toFixed(3)} (Signal: ${technicals.macdSignal.toFixed(3)}, Histogram: ${technicals.macdHistogram.toFixed(3)})
- Trend: ${technicals.macdTrend}
- Kurs vs. SMA 20: ${technicals.sma20Above ? 'Darüber' : 'Darunter'} ($${technicals.sma20.toFixed(2)})
- Kurs vs. SMA 50: ${technicals.sma50Above ? 'Darüber' : 'Darunter'} ($${technicals.sma50.toFixed(2)})

${newsSection}

${companyInfo ? `**Unternehmensdaten:**
- Sektor: ${companyInfo.sector}
- Marktkapitalisierung: $${companyInfo.marketCap}` : ''}

Erstelle jetzt die drei Szenarien als JSON-Objekt mit der folgenden Struktur:
{
  "bull": { "probability": number, "priceTarget": string, "timeframe": string, "title": string, "summary": string, "catalysts": string[], "risks": string[] },
  "bear": { "probability": number, "priceTarget": string, "timeframe": string, "title": string, "summary": string, "catalysts": string[], "risks": string[] },
  "base": { "probability": number, "priceTarget": string, "timeframe": string, "title": string, "summary": string, "catalysts": string[], "risks": string[] },
  "confidence": number,
  "reasoning": string
}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export async function generateScenarios(
  symbol: string,
  quote: StockQuote,
  technicals: TechnicalIndicators,
  news: NewsItem[],
  apiKey: string,
  companyInfo?: { name: string; sector: string; marketCap: string }
): Promise<DeepDiveResult> {
  // Initialize Anthropic client
  // Note: dangerouslyAllowBrowser is needed for client-side usage
  // In production, consider proxying through a backend
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const userPrompt = buildUserPrompt(symbol, quote, technicals, news, companyInfo);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt }
      ],
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
    const totalProb = parsed.bull.probability + parsed.bear.probability + parsed.base.probability;
    if (totalProb < 90 || totalProb > 110) {
      // Normalize to 100%
      const factor = 100 / totalProb;
      parsed.bull.probability = Math.round(parsed.bull.probability * factor);
      parsed.bear.probability = Math.round(parsed.bear.probability * factor);
      parsed.base.probability = 100 - parsed.bull.probability - parsed.bear.probability;
    }

    // Calculate token usage and cost
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    const cost = (inputTokens / 1000 * INPUT_COST_PER_1K) + 
                 (outputTokens / 1000 * OUTPUT_COST_PER_1K);

    // Build result
    const result: DeepDiveResult = {
      timestamp: new Date().toISOString(),
      type: 'deep',
      symbol,
      scenarios: {
        bull: normalizeScenario(parsed.bull, 'Optimistisches Szenario'),
        bear: normalizeScenario(parsed.bear, 'Pessimistisches Szenario'),
        base: normalizeScenario(parsed.base, 'Basis-Szenario'),
      },
      sentiment: {
        news: determineSentiment(news),
        social: 'mixed', // Would need social API
        options: 'balanced', // Would need options API
      },
      confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
      reasoning: parsed.reasoning || 'Analyse basiert auf technischen Indikatoren und aktuellen Marktdaten.',
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
        throw new Error('Ungültiger API-Schlüssel. Bitte überprüfe deinen Anthropic API-Key in den Einstellungen.');
      }
      if (error.status === 429) {
        throw new Error('API-Ratenlimit erreicht. Bitte warte einen Moment und versuche es erneut.');
      }
      if (error.status === 500) {
        throw new Error('Anthropic-Server vorübergehend nicht erreichbar. Bitte versuche es später erneut.');
      }
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function normalizeScenario(raw: any, defaultTitle: string): Scenario {
  return {
    probability: typeof raw.probability === 'number' ? raw.probability : 33,
    priceTarget: raw.priceTarget || 'N/A',
    timeframe: raw.timeframe || '6-12 Monate',
    title: raw.title || defaultTitle,
    summary: raw.summary || 'Keine Zusammenfassung verfügbar.',
    catalysts: Array.isArray(raw.catalysts) ? raw.catalysts.slice(0, 4) : [],
    risks: Array.isArray(raw.risks) ? raw.risks.slice(0, 3) : [],
  };
}

function determineSentiment(news: NewsItem[]): 'positive' | 'neutral' | 'negative' {
  if (news.length === 0) return 'neutral';
  
  const scores = news.map((n) => {
    switch (n.sentiment) {
      case 'positive': return 1;
      case 'negative': return -1;
      default: return 0;
    }
  });
  
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  if (avg > 0.3) return 'positive';
  if (avg < -0.3) return 'negative';
  return 'neutral';
}

// ═══════════════════════════════════════════════════════════════════════════
// COST ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════

export function estimateAnalysisCost(): { min: number; max: number; avg: number } {
  // Based on typical prompt and response sizes
  const avgInputTokens = 800;
  const avgOutputTokens = 1500;
  
  const avgCost = (avgInputTokens / 1000 * INPUT_COST_PER_1K) + 
                  (avgOutputTokens / 1000 * OUTPUT_COST_PER_1K);
  
  return {
    min: avgCost * 0.7,
    max: avgCost * 1.5,
    avg: avgCost,
  };
}

export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `< $0.01`;
  }
  return `$${cost.toFixed(3)}`;
}
