/**
 * Unified Market Data Service - POLYGON ONLY
 *
 * CRITICAL: This service NEVER returns fake/mock data!
 * If real data isn't available, it returns empty results.
 * Users could make investment decisions based on what they see -
 * showing fake prices is DANGEROUS.
 */

import * as polygon from './api/polygon';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import type { StockQuote, HistoricalDataPoint } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DataSource = 'polygon' | 'unavailable';

export interface MarketDataResult<T> {
  data: T | null;
  source: DataSource;
  cached: boolean;
  timestamp: number;
  error?: string;
}

export interface BulkQuotesResult {
  quotes: Map<string, StockQuote>;
  source: DataSource;
  errors: string[];
  isDemo: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE-LEVEL CACHE
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
// CONFIGURATION CHECK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if Polygon API is properly configured
 */
export function isPolygonConfigured(): boolean {
  const { getApiKey } = useApiKeysStore.getState();
  const key = getApiKey('polygon');
  return !!(key && key.trim().length > 10);
}

/**
 * Get the Polygon API key if available
 */
function getPolygonKey(): string | null {
  const { getApiKey } = useApiKeysStore.getState();
  const key = getApiKey('polygon');
  if (key && key.trim().length > 10) {
    return key;
  }
  return null;
}

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
// FETCH QUOTES - Main function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch quotes from Polygon API
 * NEVER returns fake/mock data!
 */
export async function fetchQuotes(symbols: string[]): Promise<BulkQuotesResult> {
  const polygonKey = getPolygonKey();
  const errors: string[] = [];
  const quotes = new Map<string, StockQuote>();

  // No API key = no data (NOT mock data!)
  if (!polygonKey) {
    console.warn('[MarketData] No Polygon key - returning empty (NOT mock!)');
    return {
      quotes,
      source: 'unavailable',
      errors: ['No Polygon API key configured. Add your key in Settings.'],
      isDemo: true,
    };
  }

  try {
    console.log('[MarketData] Fetching from Polygon:', symbols);
    const result = await polygon.getBulkSnapshot(symbols, polygonKey);

    // Filter out any quotes with price <= 0
    for (const [symbol, quote] of result) {
      if (quote.price > 0) {
        quotes.set(symbol, quote);
      } else {
        errors.push(`${symbol}: No valid price data`);
      }
    }

    // Update cache
    QUOTE_CACHE = {
      quotes,
      source: 'polygon',
      timestamp: Date.now(),
    };

    console.log('[MarketData] Polygon success:', quotes.size, 'valid quotes');
    return { quotes, source: 'polygon', errors, isDemo: false };
  } catch (error) {
    console.error('[MarketData] Polygon error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`API Error: ${errorMsg}`);

    // Return empty - NEVER mock data
    return {
      quotes,
      source: 'unavailable',
      errors,
      isDemo: true,
    };
  }
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
      isDemo: QUOTE_CACHE.source === 'unavailable',
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
    ? {
        quotes: QUOTE_CACHE.quotes,
        source: QUOTE_CACHE.source,
        errors: [] as string[],
        isDemo: QUOTE_CACHE.source === 'unavailable',
      }
    : {
        quotes: new Map<string, StockQuote>(),
        source: 'unavailable' as DataSource,
        errors: [] as string[],
        isDemo: true,
      };

  // Fetch in background (don't await)
  fetchQuotes(symbols).catch(console.error);

  return currentCache;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════

export async function getBulkQuotes(symbols: string[]): Promise<BulkQuotesResult> {
  return getQuotes(symbols);
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE QUOTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get single stock quote - returns null if unavailable (NEVER fake data)
 */
export async function getQuote(symbol: string): Promise<MarketDataResult<StockQuote>> {
  const now = Date.now();

  // Check module cache first
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

  // No API key = no data
  if (!polygonKey) {
    return {
      data: null,
      source: 'unavailable',
      cached: false,
      timestamp: now,
      error: 'No Polygon API key configured',
    };
  }

  // Try Polygon
  try {
    const quote = await polygon.getQuote(symbol, polygonKey);
    if (quote.price > 0) {
      return { data: quote, source: 'polygon', cached: false, timestamp: now };
    }
    return {
      data: null,
      source: 'unavailable',
      cached: false,
      timestamp: now,
      error: 'No valid price data available',
    };
  } catch (error) {
    console.warn('[MarketData] Polygon single quote failed:', error);
    return {
      data: null,
      source: 'unavailable',
      cached: false,
      timestamp: now,
      error: error instanceof Error ? error.message : 'API error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DAILY DATA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get historical daily data - returns empty array if unavailable
 */
export async function getDailyData(
  symbol: string,
  days: number = 365
): Promise<MarketDataResult<HistoricalDataPoint[]>> {
  const cacheKey = `${symbol}-${days}`;
  const now = Date.now();

  // Check cache
  const cached = dailyCache.get(cacheKey);
  if (cached && now - cached.timestamp < DAILY_CACHE_TTL) {
    return {
      data: cached.data,
      source: cached.source,
      cached: true,
      timestamp: cached.timestamp,
    };
  }

  const polygonKey = getPolygonKey();

  // No API key = no data
  if (!polygonKey) {
    return {
      data: [],
      source: 'unavailable',
      cached: false,
      timestamp: now,
      error: 'No Polygon API key configured',
    };
  }

  // Try Polygon
  try {
    const data = await polygon.getDailyData(symbol, polygonKey, days);
    dailyCache.set(cacheKey, { data, source: 'polygon', timestamp: now });
    return { data, source: 'polygon', cached: false, timestamp: now };
  } catch (error) {
    console.warn('[MarketData] Polygon daily data failed:', error);
    return {
      data: [],
      source: 'unavailable',
      cached: false,
      timestamp: now,
      error: error instanceof Error ? error.message : 'API error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTIONS DATA
// ═══════════════════════════════════════════════════════════════════════════

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
 * Get current data provider
 */
export function getCurrentProvider(): DataSource {
  return isPolygonConfigured() ? 'polygon' : 'unavailable';
}

/**
 * Get provider info with UI display properties
 */
export function getProviderInfo(): {
  source: DataSource;
  label: string;
  color: 'emerald' | 'amber' | 'slate';
  isDemo: boolean;
} {
  if (isPolygonConfigured()) {
    return {
      source: 'polygon',
      label: 'Real-time via Polygon.io',
      color: 'emerald',
      isDemo: false,
    };
  }

  return {
    source: 'unavailable',
    label: 'No data - Add Polygon API key in Settings',
    color: 'slate',
    isDemo: true,
  };
}

/**
 * Check if using real-time data
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
  getCurrentProvider,
  getProviderInfo,
  isRealtime,
  isPolygonConfigured,
};
