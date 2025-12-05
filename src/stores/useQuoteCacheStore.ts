/**
 * Quote Cache Store
 *
 * Caches stock quotes globally to prevent reloading on navigation.
 * Cache is valid for 60 seconds.
 */

import { create } from 'zustand';
import type { StockQuote } from '@/types';
import type { DataSource } from '@/services/marketData';

interface QuoteCacheState {
  quotes: Record<string, StockQuote>;
  lastFetch: number | null;
  dataSource: DataSource | null;

  setQuotes: (quotes: Map<string, StockQuote>, source: DataSource) => void;
  getQuote: (symbol: string) => StockQuote | null;
  isStale: () => boolean;
  clear: () => void;
}

// Cache is valid for 60 seconds
const CACHE_TTL = 60 * 1000;

export const useQuoteCacheStore = create<QuoteCacheState>((set, get) => ({
  quotes: {},
  lastFetch: null,
  dataSource: null,

  setQuotes: (quotesMap, source) => {
    const quotes: Record<string, StockQuote> = {};
    quotesMap.forEach((quote, symbol) => {
      quotes[symbol] = quote;
    });

    set({
      quotes,
      lastFetch: Date.now(),
      dataSource: source,
    });
  },

  getQuote: (symbol) => {
    return get().quotes[symbol] || null;
  },

  isStale: () => {
    const { lastFetch } = get();
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_TTL;
  },

  clear: () => {
    set({ quotes: {}, lastFetch: null, dataSource: null });
  },
}));
