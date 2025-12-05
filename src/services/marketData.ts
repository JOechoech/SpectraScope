/**
 * Unified Market Data Service
 *
 * Auto-selects the best available data source based on configured API keys:
 * 1. Polygon.io (Premium) - Real-time, bulk loading, options
 * 2. Alpha Vantage (Free) - Delayed quotes, rate limited
 * 3. Mock Data - Fallback when no keys available
 *
 * Key Features:
 * - getBulkQuotes: One API call for entire watchlist (Polygon)
 * - getQuote: Single stock quote
 * - getDailyData: Historical price data
 * - Graceful degradation through fallback chain
 */

import * as polygon from './api/polygon';
import * as alphavantage from './api/alphavantage';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import type { StockQuote, HistoricalDataPoint } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DataSource = 'polygon' | 'alphavantage' | 'mock';

export interface MarketDataResult<T> {
  data: T;
  source: DataSource;
  cached: boolean;
  timestamp: number;
}

export interface BulkQuotesResult {
  quotes: Map<string, StockQuote>;
  source: DataSource;
  errors: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE CACHE
// ═══════════════════════════════════════════════════════════════════════════

interface CacheEntry<T> {
  data: T;
  source: DataSource;
  timestamp: number;
}

const quoteCache = new Map<string, CacheEntry<StockQuote>>();
const dailyCache = new Map<string, CacheEntry<HistoricalDataPoint[]>>();

const CACHE_TTL = {
  quote: 60 * 1000,      // 1 minute for quotes
  daily: 5 * 60 * 1000,  // 5 minutes for daily data
};

function isCacheValid<T>(entry: CacheEntry<T> | undefined, ttl: number): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < ttl;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Get Available Data Source
// ═══════════════════════════════════════════════════════════════════════════

function getPreferredSource(): { source: DataSource; apiKey: string | null } {
  const { getApiKey } = useApiKeysStore.getState();

  const polygonKey = getApiKey('polygon');
  if (polygonKey) {
    return { source: 'polygon', apiKey: polygonKey };
  }

  const alphaKey = getApiKey('alphavantage');
  if (alphaKey) {
    return { source: 'alphavantage', apiKey: alphaKey };
  }

  return { source: 'mock', apiKey: null };
}

// ═══════════════════════════════════════════════════════════════════════════
// BULK QUOTES (Main advantage of Polygon)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get quotes for multiple symbols in a single API call (when using Polygon)
 * Falls back to sequential calls with Alpha Vantage, or mock data
 */
export async function getBulkQuotes(symbols: string[]): Promise<BulkQuotesResult> {
  const { source, apiKey } = getPreferredSource();
  const errors: string[] = [];

  // Try Polygon first (supports true bulk)
  if (source === 'polygon' && apiKey) {
    try {
      const quotes = await polygon.getBulkSnapshot(symbols, apiKey);

      // Cache each quote
      const now = Date.now();
      for (const [symbol, quote] of quotes) {
        quoteCache.set(symbol, { data: quote, source: 'polygon', timestamp: now });
      }

      return { quotes, source: 'polygon', errors };
    } catch (error) {
      errors.push(`Polygon error: ${error}`);
      // Fall through to Alpha Vantage
    }
  }

  // Try Alpha Vantage (sequential with rate limiting)
  const { getApiKey } = useApiKeysStore.getState();
  const alphaKey = getApiKey('alphavantage');

  if (alphaKey) {
    const quotes = new Map<string, StockQuote>();
    const now = Date.now();

    for (const symbol of symbols) {
      // Check cache first
      const cached = quoteCache.get(symbol);
      if (isCacheValid(cached, CACHE_TTL.quote)) {
        quotes.set(symbol, cached!.data);
        continue;
      }

      try {
        // Rate limit: 5 calls/minute for free tier
        await delay(1200);
        const quote = await alphavantage.getQuote(symbol, alphaKey);
        quotes.set(symbol, quote);
        quoteCache.set(symbol, { data: quote, source: 'alphavantage', timestamp: now });
      } catch (error) {
        errors.push(`${symbol}: ${error}`);
        // Use mock as individual fallback
        const mockQuote = polygon.getMockQuote(symbol);
        quotes.set(symbol, mockQuote);
      }
    }

    return { quotes, source: 'alphavantage', errors };
  }

  // Fallback to mock
  const mockQuotes = polygon.getMockBulkSnapshot(symbols);
  return { quotes: mockQuotes, source: 'mock', errors };
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE QUOTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get single stock quote with automatic source selection
 */
export async function getQuote(symbol: string): Promise<MarketDataResult<StockQuote>> {
  // Check cache first
  const cached = quoteCache.get(symbol);
  if (isCacheValid(cached, CACHE_TTL.quote)) {
    return {
      data: cached!.data,
      source: cached!.source,
      cached: true,
      timestamp: cached!.timestamp,
    };
  }

  const { source, apiKey } = getPreferredSource();
  const now = Date.now();

  // Try Polygon
  if (source === 'polygon' && apiKey) {
    try {
      const quote = await polygon.getQuote(symbol, apiKey);
      quoteCache.set(symbol, { data: quote, source: 'polygon', timestamp: now });
      return { data: quote, source: 'polygon', cached: false, timestamp: now };
    } catch (error) {
      console.warn('Polygon quote failed, trying Alpha Vantage:', error);
    }
  }

  // Try Alpha Vantage
  const { getApiKey } = useApiKeysStore.getState();
  const alphaKey = getApiKey('alphavantage');

  if (alphaKey) {
    try {
      const quote = await alphavantage.getQuote(symbol, alphaKey);
      quoteCache.set(symbol, { data: quote, source: 'alphavantage', timestamp: now });
      return { data: quote, source: 'alphavantage', cached: false, timestamp: now };
    } catch (error) {
      console.warn('Alpha Vantage quote failed, using mock:', error);
    }
  }

  // Fallback to mock
  const mockQuote = polygon.getMockQuote(symbol);
  return { data: mockQuote, source: 'mock', cached: false, timestamp: now };
}

// ═══════════════════════════════════════════════════════════════════════════
// DAILY DATA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get historical daily data with automatic source selection
 */
export async function getDailyData(
  symbol: string,
  days: number = 365
): Promise<MarketDataResult<HistoricalDataPoint[]>> {
  const cacheKey = `${symbol}-${days}`;

  // Check cache first
  const cached = dailyCache.get(cacheKey);
  if (isCacheValid(cached, CACHE_TTL.daily)) {
    return {
      data: cached!.data,
      source: cached!.source,
      cached: true,
      timestamp: cached!.timestamp,
    };
  }

  const { source, apiKey } = getPreferredSource();
  const now = Date.now();

  // Try Polygon
  if (source === 'polygon' && apiKey) {
    try {
      const data = await polygon.getDailyData(symbol, apiKey, days);
      dailyCache.set(cacheKey, { data, source: 'polygon', timestamp: now });
      return { data, source: 'polygon', cached: false, timestamp: now };
    } catch (error) {
      console.warn('Polygon daily data failed, trying Alpha Vantage:', error);
    }
  }

  // Try Alpha Vantage
  const { getApiKey } = useApiKeysStore.getState();
  const alphaKey = getApiKey('alphavantage');

  if (alphaKey) {
    try {
      const outputSize = days > 100 ? 'full' : 'compact';
      const data = await alphavantage.getDailyData(symbol, alphaKey, outputSize);
      dailyCache.set(cacheKey, { data, source: 'alphavantage', timestamp: now });
      return { data, source: 'alphavantage', cached: false, timestamp: now };
    } catch (error) {
      console.warn('Alpha Vantage daily data failed, using mock:', error);
    }
  }

  // Fallback to mock
  const mockData = polygon.getMockDailyData(symbol, days);
  return { data: mockData, source: 'mock', cached: false, timestamp: now };
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTIONS DATA (Polygon only)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get options chain - only available with Polygon
 */
export async function getOptionsChain(
  symbol: string,
  expirationDate?: string
): Promise<polygon.PolygonOption[] | null> {
  const { getApiKey } = useApiKeysStore.getState();
  const polygonKey = getApiKey('polygon');

  if (!polygonKey) {
    return null;
  }

  try {
    return await polygon.getOptionsChain(symbol, polygonKey, expirationDate);
  } catch (error) {
    console.error('Options chain error:', error);
    return null;
  }
}

/**
 * Get options metrics - only available with Polygon
 */
export async function getOptionsMetrics(
  symbol: string
): Promise<polygon.OptionsMetrics | null> {
  const options = await getOptionsChain(symbol);
  if (!options || options.length === 0) {
    return null;
  }

  return polygon.calculateOptionsMetrics(options);
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clear all caches (useful when API keys change)
 */
export function clearCache(): void {
  quoteCache.clear();
  dailyCache.clear();
}

/**
 * Get info about current data source
 */
export function getDataSourceInfo(): {
  source: DataSource;
  capabilities: string[];
} {
  const { source } = getPreferredSource();

  const capabilities: Record<DataSource, string[]> = {
    polygon: [
      'Real-time quotes',
      'Bulk loading (one API call)',
      'Options chain with Greeks',
      'No rate limiting',
    ],
    alphavantage: [
      'Delayed quotes (15-20 min)',
      'Historical data',
      'Rate limited (5 calls/min)',
    ],
    mock: [
      'Demo data only',
      'No real market data',
    ],
  };

  return {
    source,
    capabilities: capabilities[source],
  };
}

/**
 * Get current data provider - POLYGON FIRST!
 */
export function getCurrentProvider(): DataSource {
  const { source } = getPreferredSource();
  return source;
}

/**
 * Get human-readable label for current provider
 */
export function getProviderLabel(): string {
  const provider = getCurrentProvider();
  switch (provider) {
    case 'polygon':
      return 'Real-time via Polygon.io';
    case 'alphavantage':
      return 'Delayed quotes via Alpha Vantage';
    default:
      return 'Demo mode (no API key)';
  }
}

/**
 * Check if current provider supports real-time data
 */
export function isRealtime(): boolean {
  return getCurrentProvider() === 'polygon';
}

export default {
  getBulkQuotes,
  getQuote,
  getDailyData,
  getOptionsChain,
  getOptionsMetrics,
  clearCache,
  getDataSourceInfo,
  getCurrentProvider,
  getProviderLabel,
  isRealtime,
};
