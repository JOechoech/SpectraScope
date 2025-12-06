/**
 * Unified Market Data Service - POLYGON ONLY
 *
 * Data source hierarchy:
 * 1. Polygon.io (when key exists) - Real-time, bulk loading
 * 2. Mock Data - Fallback when no keys available
 *
 * NO Alpha Vantage fallback - it's too slow and rate limited.
 */

import * as polygon from './api/polygon';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import type { StockQuote, HistoricalDataPoint } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DataSource = 'polygon' | 'mock';

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
// MODULE-LEVEL CACHE (survives component navigation)
// ═══════════════════════════════════════════════════════════════════════════

interface QuoteCache {
  quotes: Map<string, StockQuote>;
  source: DataSource;
  timestamp: number;
}

let QUOTE_CACHE: QuoteCache | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

const dailyCache = new Map<string, { data: HistoricalDataPoint[]; source: DataSource; timestamp: number }>();
const DAILY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ═══════════════════════════════════════════════════════════════════════════
// CACHE ACCESS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get cached quotes if available
 */
export function getCachedQuotes(): Map<string, StockQuote> | null {
  if (!QUOTE_CACHE) return null;
  return QUOTE_CACHE.quotes;
}

/**
 * Check if cache is still fresh
 */
export function isCacheFresh(): boolean {
  if (!QUOTE_CACHE) return false;
  return Date.now() - QUOTE_CACHE.timestamp < CACHE_TTL;
}

/**
 * Get current data source from cache
 */
export function getDataSource(): DataSource | null {
  return QUOTE_CACHE?.source ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Get Polygon Key
// ═══════════════════════════════════════════════════════════════════════════

function getPolygonKey(): string | null {
  const { getApiKey } = useApiKeysStore.getState();
  const key = getApiKey('polygon');
  if (key && key.trim().length > 5) {
    return key;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH QUOTES - Main function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch fresh quotes from API (Polygon only, fallback to mock)
 */
export async function fetchQuotes(symbols: string[]): Promise<BulkQuotesResult> {
  const polygonKey = getPolygonKey();
  const errors: string[] = [];

  // Try Polygon ONLY
  if (polygonKey) {
    try {
      console.log('[MarketData] Fetching from Polygon...');
      const quotes = await polygon.getBulkSnapshot(symbols, polygonKey);

      // Update cache
      QUOTE_CACHE = {
        quotes,
        source: 'polygon',
        timestamp: Date.now(),
      };

      console.log('[MarketData] Polygon success:', quotes.size, 'quotes');
      return { quotes, source: 'polygon', errors };
    } catch (error) {
      console.error('[MarketData] Polygon error:', error);
      errors.push(`Polygon: ${error}`);
      // Fall through to mock
    }
  }

  // Mock fallback
  console.log('[MarketData] Using MOCK data');
  const mockQuotes = polygon.getMockBulkSnapshot(symbols);

  QUOTE_CACHE = {
    quotes: mockQuotes,
    source: 'mock',
    timestamp: Date.now(),
  };

  return { quotes: mockQuotes, source: 'mock', errors };
}

/**
 * Get quotes - uses cache if fresh, otherwise fetches
 */
export async function getQuotes(symbols: string[]): Promise<BulkQuotesResult> {
  // Return cache if fresh
  if (QUOTE_CACHE && isCacheFresh()) {
    console.log('[MarketData] Using cached quotes');
    return {
      quotes: QUOTE_CACHE.quotes,
      source: QUOTE_CACHE.source,
      errors: [],
    };
  }

  // Fetch fresh
  return fetchQuotes(symbols);
}

/**
 * Refresh quotes in background (returns cached immediately)
 */
export async function refreshInBackground(symbols: string[]): Promise<BulkQuotesResult> {
  // Return current cache immediately
  const currentCache = QUOTE_CACHE
    ? { quotes: QUOTE_CACHE.quotes, source: QUOTE_CACHE.source, errors: [] as string[] }
    : { quotes: new Map<string, StockQuote>(), source: 'mock' as DataSource, errors: [] as string[] };

  // Fetch in background (don't await)
  fetchQuotes(symbols).catch(console.error);

  return currentCache;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY - getBulkQuotes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Legacy function - wraps getQuotes
 */
export async function getBulkQuotes(symbols: string[]): Promise<BulkQuotesResult> {
  return getQuotes(symbols);
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE QUOTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get single stock quote
 */
export async function getQuote(symbol: string): Promise<MarketDataResult<StockQuote>> {
  // Check module cache
  if (QUOTE_CACHE && isCacheFresh()) {
    const cached = QUOTE_CACHE.quotes.get(symbol);
    if (cached) {
      return {
        data: cached,
        source: QUOTE_CACHE.source,
        cached: true,
        timestamp: QUOTE_CACHE.timestamp,
      };
    }
  }

  const polygonKey = getPolygonKey();
  const now = Date.now();

  // Try Polygon
  if (polygonKey) {
    try {
      const quote = await polygon.getQuote(symbol, polygonKey);
      return { data: quote, source: 'polygon', cached: false, timestamp: now };
    } catch (error) {
      console.warn('[MarketData] Polygon single quote failed:', error);
    }
  }

  // Mock fallback
  const mockQuote = polygon.getMockQuote(symbol);
  return { data: mockQuote, source: 'mock', cached: false, timestamp: now };
}

// ═══════════════════════════════════════════════════════════════════════════
// DAILY DATA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get historical daily data
 */
export async function getDailyData(
  symbol: string,
  days: number = 365
): Promise<MarketDataResult<HistoricalDataPoint[]>> {
  const cacheKey = `${symbol}-${days}`;

  // Check cache
  const cached = dailyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DAILY_CACHE_TTL) {
    return {
      data: cached.data,
      source: cached.source,
      cached: true,
      timestamp: cached.timestamp,
    };
  }

  const polygonKey = getPolygonKey();
  const now = Date.now();

  // Try Polygon
  if (polygonKey) {
    try {
      const data = await polygon.getDailyData(symbol, polygonKey, days);
      dailyCache.set(cacheKey, { data, source: 'polygon', timestamp: now });
      return { data, source: 'polygon', cached: false, timestamp: now };
    } catch (error) {
      console.warn('[MarketData] Polygon daily data failed:', error);
    }
  }

  // Mock fallback
  const mockData = polygon.getMockDailyData(symbol, days);
  dailyCache.set(cacheKey, { data: mockData, source: 'mock', timestamp: now });
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
  const polygonKey = getPolygonKey();
  if (!polygonKey) return null;

  try {
    return await polygon.getOptionsChain(symbol, polygonKey, expirationDate);
  } catch (error) {
    console.error('[MarketData] Options chain error:', error);
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
  if (!options || options.length === 0) return null;
  return polygon.calculateOptionsMetrics(options);
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clear all caches
 */
export function clearCache(): void {
  QUOTE_CACHE = null;
  dailyCache.clear();
  console.log('[MarketData] Cache cleared');
}

/**
 * Get info about current data source
 */
export function getDataSourceInfo(): {
  source: DataSource;
  capabilities: string[];
} {
  const polygonKey = getPolygonKey();
  const source: DataSource = polygonKey ? 'polygon' : 'mock';

  const capabilities: Record<DataSource, string[]> = {
    polygon: [
      'Real-time quotes',
      'Bulk loading (one API call)',
      'Options chain with Greeks',
      'No rate limiting',
    ],
    mock: [
      'Demo data only',
      'No real market data',
    ],
  };

  return { source, capabilities: capabilities[source] };
}

/**
 * Get current data provider
 */
export function getCurrentProvider(): DataSource {
  const polygonKey = getPolygonKey();
  return polygonKey ? 'polygon' : 'mock';
}

/**
 * Get human-readable label for current provider
 */
export function getProviderLabel(): string {
  const provider = getCurrentProvider();
  switch (provider) {
    case 'polygon':
      return 'Real-time via Polygon.io';
    default:
      return 'Demo mode (no API key)';
  }
}

/**
 * Get provider info with color for UI display
 */
export function getProviderInfo(): {
  source: DataSource;
  label: string;
  color: 'emerald' | 'slate';
} {
  const source = getCurrentProvider();

  switch (source) {
    case 'polygon':
      return {
        source,
        label: 'Real-time via Polygon.io',
        color: 'emerald',
      };
    default:
      return {
        source,
        label: 'Demo mode - Add Polygon key in Settings',
        color: 'slate',
      };
  }
}

/**
 * Check if current provider supports real-time data
 */
export function isRealtime(): boolean {
  return getCurrentProvider() === 'polygon';
}

export default {
  // Main functions
  getQuotes,
  fetchQuotes,
  refreshInBackground,
  getCachedQuotes,
  isCacheFresh,
  getDataSource,
  // Legacy
  getBulkQuotes,
  getQuote,
  getDailyData,
  // Options
  getOptionsChain,
  getOptionsMetrics,
  // Utils
  clearCache,
  getDataSourceInfo,
  getCurrentProvider,
  getProviderLabel,
  getProviderInfo,
  isRealtime,
};
