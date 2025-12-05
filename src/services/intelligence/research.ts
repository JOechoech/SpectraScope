/**
 * Research Intelligence Service (Stub)
 *
 * Will integrate with Perplexity API for web research and citations.
 * Currently returns null - to be implemented when API access is available.
 */

import { useApiKeysStore } from '@/stores/useApiKeysStore';
import type { ResearchReport, ResearchReportData } from '@/types/intelligence';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GATHER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gather research intelligence from Perplexity
 *
 * @param symbol - Stock symbol
 * @param companyName - Company name for better search context
 * @returns Research intelligence report or null if unavailable
 */
export async function gatherResearchIntelligence(
  symbol: string,
  companyName?: string
): Promise<ResearchReport | null> {
  try {
    const apiKey = useApiKeysStore.getState().getApiKey('perplexity');

    if (!apiKey) {
      console.debug('[Research] No Perplexity API key configured');
      return null;
    }

    // TODO: Implement Perplexity API integration
    // The API should research recent developments, analyst opinions,
    // and provide citations for all findings

    console.debug(`[Research] Perplexity integration pending for ${symbol}`);

    // Return mock data for development/testing
    if (process.env.NODE_ENV === 'development') {
      return createMockResearchReport(symbol, companyName);
    }

    return null;
  } catch (error) {
    console.error(`[Research] Error gathering intelligence for ${symbol}:`, error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA (Development only)
// ═══════════════════════════════════════════════════════════════════════════

function createMockResearchReport(
  symbol: string,
  companyName?: string
): ResearchReport {
  const name = companyName || symbol;

  const mockData: ResearchReportData = {
    keyFindings: [
      `${name} reported strong Q3 earnings, beating estimates by 12%`,
      `Management raised full-year guidance citing robust demand`,
      `New product launch expected in Q1 2026 could drive growth`,
    ],
    recentDevelopments: [
      'Announced $5B share buyback program',
      'Expanded partnership with major cloud provider',
      'CEO interview on CNBC highlighted AI initiatives',
    ],
    analystConsensus: `Analysts maintain a consensus "Buy" rating on ${symbol} with an average price target implying 15% upside from current levels.`,
    priceTargets: {
      low: 180,
      median: 220,
      high: 275,
      numberOfAnalysts: 28,
    },
    upcomingEvents: [
      'Earnings call on Feb 1, 2026',
      'Investor Day on March 15, 2026',
      'Product announcement expected Q1',
    ],
    citations: [
      {
        title: `${symbol} Q3 Earnings Report`,
        url: `https://ir.example.com/${symbol.toLowerCase()}/earnings`,
        snippet: 'Revenue grew 18% year-over-year...',
      },
      {
        title: `Analyst Coverage: ${name}`,
        url: 'https://finance.example.com/analysis',
        snippet: '28 analysts covering the stock...',
      },
      {
        title: 'Industry Outlook Report',
        url: 'https://research.example.com/sector',
        snippet: 'Sector expected to grow 12% annually...',
      },
    ],
  };

  return {
    source: 'web-research',
    timestamp: new Date().toISOString(),
    confidence: 70, // Lower confidence for mock data
    data: mockData,
    summary: `[MOCK] ${name} shows positive momentum with strong earnings and raised guidance. Analyst consensus is bullish with ${mockData.priceTargets?.numberOfAnalysts} analysts covering. Key upcoming catalyst: ${mockData.upcomingEvents[0]}.`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FUTURE: PERPLEXITY API INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/*
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface PerplexityRequest {
  model: 'pplx-7b-online' | 'pplx-70b-online';
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  return_citations?: boolean;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  citations?: string[];
}

async function researchWithPerplexity(
  symbol: string,
  companyName: string,
  apiKey: string
): Promise<ResearchReportData> {
  const systemPrompt = `You are a financial research analyst. Provide factual,
    well-sourced information about the given stock. Focus on:
    1. Recent earnings and financial performance
    2. Key developments and news
    3. Analyst opinions and price targets
    4. Upcoming catalysts and events
    Always cite your sources.`;

  const userPrompt = `Research ${symbol} (${companyName}) stock.
    What are the key recent developments, analyst consensus, and upcoming catalysts?`;

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'pplx-70b-online',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      return_citations: true,
    } as PerplexityRequest),
  });

  const data: PerplexityResponse = await response.json();

  // Parse the response and extract structured data
  // This would require parsing the AI response into our schema
  return parsePerplexityResponse(data);
}
*/
