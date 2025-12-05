/**
 * Polygon.io API Integration
 *
 * Features:
 * - Real-time stock quotes
 * - Bulk snapshot (all watchlist stocks in one call)
 * - Options chain with Greeks
 * - Previous day's OHLCV
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
// MOCK DATA (Fallback when no API key)
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_PRICES: Record<string, number> = {
  AAPL: 195.23,
  MSFT: 425.67,
  GOOGL: 175.89,
  NVDA: 875.43,
  TSLA: 248.92,
  AMZN: 186.54,
  META: 512.38,
  JPM: 198.76,
  V: 287.45,
  BRK: 412.33,
};

const MOCK_CHANGES: Record<string, number> = {
  AAPL: 2.34,
  MSFT: -1.23,
  GOOGL: 3.45,
  NVDA: 12.56,
  TSLA: -5.67,
  AMZN: 1.89,
  META: 4.32,
  JPM: -0.87,
  V: 2.12,
  BRK: 1.45,
};

export function getMockQuote(symbol: string): StockQuote {
  const price = MOCK_PRICES[symbol] || 100 + Math.random() * 200;
  const change = MOCK_CHANGES[symbol] || (Math.random() - 0.5) * 10;
  const changePercent = (change / price) * 100;

  return {
    symbol,
    price,
    change,
    changePercent,
    volume: Math.floor(10000000 + Math.random() * 50000000),
    open: price - change + (Math.random() - 0.5) * 2,
    high: price + Math.abs(change) + Math.random() * 3,
    low: price - Math.abs(change) - Math.random() * 3,
    previousClose: price - change,
    latestTradingDay: new Date().toISOString().split('T')[0],
  };
}

export function getMockBulkSnapshot(symbols: string[]): Map<string, StockQuote> {
  const results = new Map<string, StockQuote>();
  for (const symbol of symbols) {
    results.set(symbol, getMockQuote(symbol));
  }
  return results;
}

export function getMockDailyData(symbol: string, days: number = 365): HistoricalDataPoint[] {
  const basePrice = MOCK_PRICES[symbol] || 150;
  const data: HistoricalDataPoint[] = [];

  let price = basePrice * (0.7 + Math.random() * 0.3);

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Random walk
    const change = (Math.random() - 0.48) * basePrice * 0.03;
    price = Math.max(price + change, basePrice * 0.3);

    const dailyVolatility = Math.random() * 0.02;
    const high = price * (1 + dailyVolatility);
    const low = price * (1 - dailyVolatility);
    const open = low + Math.random() * (high - low);

    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close: price,
      volume: Math.floor(10000000 + Math.random() * 40000000),
    });
  }

  return data.reverse();
}

export default {
  getBulkSnapshot,
  getQuote,
  getDailyData,
  getOptionsChain,
  calculateOptionsMetrics,
  getMockQuote,
  getMockBulkSnapshot,
  getMockDailyData,
};
