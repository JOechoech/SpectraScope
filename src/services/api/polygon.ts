/**
 * Polygon.io API Integration
 *
 * Features:
 * - Real-time stock quotes
 * - Bulk snapshot (all watchlist stocks in one call)
 * - Options chain with Greeks
 * - Previous day's OHLCV
 * - API key validation
 *
 * IMPORTANT: This module NEVER returns fake/mock data!
 * All data comes from the real Polygon.io API.
 *
 * API Docs: https://polygon.io/docs
 */

import type { StockQuote, HistoricalDataPoint } from '@/types';

const POLYGON_BASE = 'https://api.polygon.io';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PolygonTicker {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  updated: number;
  day: {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
  };
  prevDay: {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
  };
  min?: {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
    av: number;
  };
}

export interface PolygonSnapshotResponse {
  status: string;
  tickers: PolygonTicker[];
}

export interface PolygonQuoteResponse {
  status: string;
  ticker: PolygonTicker;
}

export interface PolygonAggregateResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: Array<{
    v: number;    // Volume
    vw: number;   // Volume weighted average price
    o: number;    // Open
    c: number;    // Close
    h: number;    // High
    l: number;    // Low
    t: number;    // Timestamp (Unix ms)
    n: number;    // Number of transactions
  }>;
}

export interface PolygonOption {
  ticker: string;
  underlying_ticker: string;
  expiration_date: string;
  strike_price: number;
  contract_type: 'call' | 'put';
  day: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    vwap: number;
    last_updated: number;
  };
  greeks?: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  implied_volatility?: number;
  open_interest?: number;
}

export interface PolygonOptionsResponse {
  results: PolygonOption[];
  status: string;
  next_url?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// API KEY VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export interface ApiKeyValidationResult {
  valid: boolean;
  error?: string;
  plan?: string;
}

/**
 * Test if a Polygon API key is valid by making a real API call
 * This ensures the green checkmark only shows when the key actually works!
 */
export async function testApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { valid: false, error: 'Invalid key format' };
  }

  try {
    // Test with a simple previous day request for AAPL
    const url = `${POLYGON_BASE}/v2/aggs/ticker/AAPL/prev?apiKey=${apiKey}`;
    const response = await fetch(url);

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'Invalid or expired API key' };
    }

    if (!response.ok) {
      return { valid: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();

    if (data.status === 'ERROR') {
      return { valid: false, error: data.error || 'API returned error' };
    }

    // Check if we got actual data
    if (data.results && data.results.length > 0) {
      return { valid: true };
    }

    // Weekend/holiday - API works but no data
    if (data.resultsCount === 0) {
      return { valid: true }; // Key is valid, just no data for today
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get bulk snapshot of multiple tickers in a single API call
 * This is the key advantage of Polygon - one call for entire watchlist
 */
export async function getBulkSnapshot(
  symbols: string[],
  apiKey: string
): Promise<Map<string, StockQuote>> {
  const tickerList = symbols.join(',');

  try {
    const response = await fetch(
      `${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickerList}&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`);
    }

    const data: PolygonSnapshotResponse = await response.json();

    const results = new Map<string, StockQuote>();

    for (const ticker of data.tickers) {
      results.set(ticker.ticker, {
        symbol: ticker.ticker,
        price: ticker.day?.c || ticker.prevDay?.c || 0,
        change: ticker.todaysChange || 0,
        changePercent: ticker.todaysChangePerc || 0,
        volume: ticker.day?.v || ticker.prevDay?.v || 0,
        open: ticker.day?.o || ticker.prevDay?.o || 0,
        high: ticker.day?.h || ticker.prevDay?.h || 0,
        low: ticker.day?.l || ticker.prevDay?.l || 0,
        previousClose: ticker.prevDay?.c || 0,
        latestTradingDay: new Date(ticker.updated).toISOString().split('T')[0],
      });
    }

    return results;
  } catch (error) {
    console.error('Polygon bulk snapshot error:', error);
    throw error;
  }
}

/**
 * Get single stock quote
 */
export async function getQuote(
  symbol: string,
  apiKey: string
): Promise<StockQuote> {
  try {
    const response = await fetch(
      `${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`);
    }

    const data: PolygonQuoteResponse = await response.json();
    const ticker = data.ticker;

    return {
      symbol: ticker.ticker,
      price: ticker.day?.c || ticker.prevDay?.c || 0,
      change: ticker.todaysChange || 0,
      changePercent: ticker.todaysChangePerc || 0,
      volume: ticker.day?.v || ticker.prevDay?.v || 0,
      open: ticker.day?.o || ticker.prevDay?.o || 0,
      high: ticker.day?.h || ticker.prevDay?.h || 0,
      low: ticker.day?.l || ticker.prevDay?.l || 0,
      previousClose: ticker.prevDay?.c || 0,
      latestTradingDay: new Date(ticker.updated).toISOString().split('T')[0],
    };
  } catch (error) {
    console.error('Polygon quote error:', error);
    throw error;
  }
}

/**
 * Get historical daily data (aggregates)
 */
export async function getDailyData(
  symbol: string,
  apiKey: string,
  days: number = 365
): Promise<HistoricalDataPoint[]> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  try {
    const response = await fetch(
      `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=desc&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`);
    }

    const data: PolygonAggregateResponse = await response.json();

    return data.results.map((bar) => ({
      date: new Date(bar.t).toISOString().split('T')[0],
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));
  } catch (error) {
    console.error('Polygon daily data error:', error);
    throw error;
  }
}

/**
 * Get options chain for a symbol with Greeks
 */
export async function getOptionsChain(
  symbol: string,
  apiKey: string,
  expirationDate?: string
): Promise<PolygonOption[]> {
  try {
    let url = `${POLYGON_BASE}/v3/snapshot/options/${symbol}?apiKey=${apiKey}`;

    if (expirationDate) {
      url += `&expiration_date=${expirationDate}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`);
    }

    const data: PolygonOptionsResponse = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Polygon options error:', error);
    throw error;
  }
}

/**
 * Calculate options metrics from chain data
 */
export interface OptionsMetrics {
  putCallRatio: number;
  totalCallVolume: number;
  totalPutVolume: number;
  totalCallOI: number;
  totalPutOI: number;
  avgCallIV: number;
  avgPutIV: number;
  aggregateDelta: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export function calculateOptionsMetrics(options: PolygonOption[]): OptionsMetrics | null {
  if (options.length === 0) return null;

  const calls = options.filter((o) => o.contract_type === 'call');
  const puts = options.filter((o) => o.contract_type === 'put');

  const totalCallVolume = calls.reduce((sum, o) => sum + (o.day?.volume || 0), 0);
  const totalPutVolume = puts.reduce((sum, o) => sum + (o.day?.volume || 0), 0);

  const totalCallOI = calls.reduce((sum, o) => sum + (o.open_interest || 0), 0);
  const totalPutOI = puts.reduce((sum, o) => sum + (o.open_interest || 0), 0);

  const callsWithIV = calls.filter((o) => o.implied_volatility != null);
  const putsWithIV = puts.filter((o) => o.implied_volatility != null);

  const avgCallIV = callsWithIV.length > 0
    ? callsWithIV.reduce((sum, o) => sum + (o.implied_volatility || 0), 0) / callsWithIV.length
    : 0;

  const avgPutIV = putsWithIV.length > 0
    ? putsWithIV.reduce((sum, o) => sum + (o.implied_volatility || 0), 0) / putsWithIV.length
    : 0;

  const optionsWithDelta = options.filter((o) => o.greeks?.delta != null);
  const aggregateDelta = optionsWithDelta.length > 0
    ? optionsWithDelta.reduce((sum, o) => sum + (o.greeks?.delta || 0), 0)
    : 0;

  const putCallRatio = totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 0;

  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (putCallRatio < 0.7 || aggregateDelta > 0.3) {
    sentiment = 'bullish';
  } else if (putCallRatio > 1.0 || aggregateDelta < -0.3) {
    sentiment = 'bearish';
  }

  return {
    putCallRatio,
    totalCallVolume,
    totalPutVolume,
    totalCallOI,
    totalPutOI,
    avgCallIV,
    avgPutIV,
    aggregateDelta,
    sentiment,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TICKER SEARCH
// ═══════════════════════════════════════════════════════════════════════════

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
}

/**
 * Search for tickers by name or symbol
 */
export async function searchTickers(
  query: string,
  apiKey: string
): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `${POLYGON_BASE}/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&limit=15&apiKey=${apiKey}`
    );

    if (!response.ok) {
      console.error('Polygon search error:', response.status);
      return [];
    }

    const data = await response.json();

    return (data.results || []).map((t: any) => ({
      symbol: t.ticker,
      name: t.name,
      type: t.type || 'Stock',
    }));
  } catch (error) {
    console.error('Polygon search failed:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  testApiKey,
  getBulkSnapshot,
  getQuote,
  getDailyData,
  getOptionsChain,
  calculateOptionsMetrics,
  searchTickers,
};
