/**
 * Claude Opus Orchestrator
 *
 * Uses Claude Opus 4.5 to analyze tickers and generate custom prompts
 * for each AI source (Grok, OpenAI, Gemini).
 *
 * This "Master Brain" approach:
 * 1. Opus analyzes the ticker, sector, and context
 * 2. Generates tailored search prompts for each AI
 * 3. Results in more relevant, company-specific intelligence
 */

import Anthropic from '@anthropic-ai/sdk';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const OPUS_MODEL = 'claude-opus-4-5-20250514';
const SONNET_MODEL = 'claude-sonnet-4-5-20250514';

// Token costs (USD per 1K tokens)
const OPUS_INPUT_COST = 0.015;   // $15 per 1M
const OPUS_OUTPUT_COST = 0.075;  // $75 per 1M
const SONNET_INPUT_COST = 0.003; // $3 per 1M
const SONNET_OUTPUT_COST = 0.015; // $15 per 1M

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface OrchestratorInstructions {
  companyType: 'biotech' | 'tech' | 'finance' | 'retail' | 'energy' | 'healthcare' | 'industrial' | 'other';
  keyTopics: string[];
  grokPrompt: string;
  openaiPrompt: string;
  geminiPrompt: string;
  tokenUsage?: {
    input: number;
    output: number;
    cost: number;
  };
}

export interface OrchestratorParams {
  symbol: string;
  companyName: string;
  sector?: string;
  currentPrice: number;
  apiKey: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR PROMPT
// ═══════════════════════════════════════════════════════════════════════════

function buildOrchestratorPrompt(
  symbol: string,
  companyName: string,
  sector: string,
  currentPrice: number
): string {
  return `You are a financial research orchestrator. Analyze this stock and generate specialized search prompts for other AI systems.

STOCK: ${symbol} - ${companyName}
SECTOR: ${sector}
CURRENT PRICE: $${currentPrice.toFixed(2)}

Your task:
1. Identify what type of company this is (biotech, tech, finance, retail, energy, healthcare, industrial, other)
2. Identify key topics to research (products, trials, executives, competitors, recent events)
3. Generate THREE specialized prompts:

OUTPUT FORMAT (JSON only, no markdown):
{
  "companyType": "biotech|tech|finance|retail|energy|healthcare|industrial|other",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "grokPrompt": "Search X/Twitter for: [specific cashtags, hashtags, product names, executive names to search]",
  "openaiPrompt": "Search for official company news: [specific SEC filings, press release topics, IR announcements to look for]",
  "geminiPrompt": "Search news for: [specific news topics, analyst coverage, industry context to research]"
}

EXAMPLES:

For ATYR (aTyr Pharma - biotech):
{
  "companyType": "biotech",
  "keyTopics": ["Efzofitimod", "Phase 3 trial", "pulmonary sarcoidosis", "FDA status"],
  "grokPrompt": "Search X/Twitter for: $ATYR, aTyr Pharma, Efzofitimod, pulmonary sarcoidosis treatment. Find retail sentiment, trial result reactions, analyst mentions from last 7 days.",
  "openaiPrompt": "Search for aTyr Pharma official news: Phase 3 EFZO-FIT trial results, FDA communications, SEC 8-K filings, investor presentations, earnings calls from last 30 days.",
  "geminiPrompt": "Search news for: aTyr Pharma clinical trial updates, Efzofitimod efficacy data, biotech analyst coverage, pulmonary sarcoidosis treatment landscape, competitor drugs from last 14 days."
}

For AAPL (Apple - tech):
{
  "companyType": "tech",
  "keyTopics": ["iPhone sales", "Services revenue", "AI features", "China market"],
  "grokPrompt": "Search X/Twitter for: $AAPL, Apple stock, iPhone 17, Apple AI, Apple Vision Pro. Find retail sentiment, product reactions from last 7 days.",
  "openaiPrompt": "Search for Apple official news: earnings reports, product announcements, SEC filings, Tim Cook statements, supply chain updates from last 30 days.",
  "geminiPrompt": "Search news for: Apple financial performance, iPhone market share, Apple services growth, AI strategy, China sales data from last 14 days."
}

For NVDA (NVIDIA - tech/AI):
{
  "companyType": "tech",
  "keyTopics": ["AI chips", "Data center revenue", "Blackwell architecture", "H100/H200 demand"],
  "grokPrompt": "Search X/Twitter for: $NVDA, NVIDIA stock, Blackwell, H100, AI chips, Jensen Huang. Find sentiment about AI demand, chip supply from last 7 days.",
  "openaiPrompt": "Search for NVIDIA official news: data center revenue, AI chip announcements, earnings guidance, partnership deals, SEC filings from last 30 days.",
  "geminiPrompt": "Search news for: NVIDIA financial results, AI chip competition (AMD, Intel), data center growth, Blackwell reviews, analyst price targets from last 14 days."
}

Now analyze ${symbol} - ${companyName} and generate the prompts:`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get custom prompts from Claude Opus for each AI source
 */
export async function getOrchestratorInstructions(
  params: OrchestratorParams
): Promise<OrchestratorInstructions> {
  const { symbol, companyName, sector = 'Unknown', currentPrice, apiKey } = params;

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const prompt = buildOrchestratorPrompt(symbol, companyName, sector, currentPrice);

  try {
    console.debug(`[Orchestrator] Opus analyzing ${symbol}...`);

    const response = await client.messages.create({
      model: OPUS_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract text content
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Opus');
    }

    // Parse JSON
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Opus response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Calculate token usage
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    const cost =
      (inputTokens / 1000) * OPUS_INPUT_COST +
      (outputTokens / 1000) * OPUS_OUTPUT_COST;

    console.debug(`[Orchestrator] Opus completed. Cost: $${cost.toFixed(4)}`);

    return {
      companyType: parsed.companyType || 'other',
      keyTopics: parsed.keyTopics || [],
      grokPrompt: parsed.grokPrompt || `Search X/Twitter for: $${symbol}, ${companyName}`,
      openaiPrompt: parsed.openaiPrompt || `Search for ${companyName} official news`,
      geminiPrompt: parsed.geminiPrompt || `Search news for: ${companyName}`,
      tokenUsage: {
        input: inputTokens,
        output: outputTokens,
        cost: Math.round(cost * 10000) / 10000,
      },
    };
  } catch (error) {
    console.error('[Orchestrator] Opus error:', error);

    // Return fallback prompts
    return createFallbackInstructions(symbol, companyName);
  }
}

/**
 * Fallback prompts if Opus fails
 */
function createFallbackInstructions(
  symbol: string,
  companyName: string
): OrchestratorInstructions {
  return {
    companyType: 'other',
    keyTopics: [companyName, symbol, 'stock', 'earnings'],
    grokPrompt: `Search X/Twitter for: $${symbol}, ${companyName} stock. Find retail sentiment, recent mentions from last 7 days.`,
    openaiPrompt: `Search for ${companyName} (${symbol}) official news: earnings reports, SEC filings, press releases from last 30 days.`,
    geminiPrompt: `Search news for: ${companyName} financial performance, analyst coverage, recent developments from last 14 days.`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SONNET SYNTHESIZER
// ═══════════════════════════════════════════════════════════════════════════

export { SONNET_MODEL, SONNET_INPUT_COST, SONNET_OUTPUT_COST };
