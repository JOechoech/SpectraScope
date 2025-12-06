import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchlistItem, Stock, AnalysisResult } from '@/types';

// Portfolio holding for a stock
export interface Holding {
  symbol: string;
  shares: number;
  avgCost?: number; // Average cost basis
  addedAt: string;
}

interface ScopedStockInfo {
  scopedFrom: string; // Sector ID
  scopedPrice?: number; // Price when scoped
  scopedSentiment?: 'bullish' | 'bearish' | 'neutral'; // Sentiment at scope time
  scopedSource?: 'grok' | 'full-ai'; // Which scan found it
}

interface WatchlistState {
  items: WatchlistItem[];
  selectedSymbol: string | null;
  analysisHistory: Record<string, AnalysisResult[]>;
  holdings: Record<string, Holding>; // Portfolio holdings

  // Actions
  addStock: (stock: Stock, scopedInfo?: ScopedStockInfo) => void;
  removeStock: (symbol: string) => void;
  updateStock: (symbol: string, updates: Partial<WatchlistItem>) => void;
  selectStock: (symbol: string | null) => void;
  reorderStocks: (fromIndex: number, toIndex: number) => void;

  // Holdings
  setShares: (symbol: string, shares: number) => void;
  setAvgCost: (symbol: string, avgCost: number) => void;
  getHolding: (symbol: string) => Holding | null;
  getTotalShares: (symbol: string) => number;
  getHoldingsWithShares: () => Holding[]; // Get all holdings with shares > 0

  // Analysis
  addAnalysis: (symbol: string, analysis: AnalysisResult) => void;
  getLatestAnalysis: (symbol: string) => AnalysisResult | undefined;
  clearAnalysisHistory: (symbol: string) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [
        // Default watchlist items
        { 
          symbol: 'TSLA', 
          name: 'Tesla Inc', 
          price: 248.50, 
          change: 12.35, 
          changePercent: 5.23,
          sparkline: [220, 225, 218, 230, 235, 228, 242, 248],
          addedAt: new Date().toISOString()
        },
        { 
          symbol: 'NVDA', 
          name: 'NVIDIA Corp', 
          price: 875.28, 
          change: -18.42, 
          changePercent: -2.06,
          sparkline: [920, 915, 900, 890, 885, 870, 880, 875],
          addedAt: new Date().toISOString()
        },
        { 
          symbol: 'AAPL', 
          name: 'Apple Inc', 
          price: 189.84, 
          change: 2.15, 
          changePercent: 1.15,
          sparkline: [185, 186, 188, 187, 189, 188, 190, 189],
          addedAt: new Date().toISOString()
        },
        { 
          symbol: 'MSFT', 
          name: 'Microsoft Corp', 
          price: 378.91, 
          change: 4.67, 
          changePercent: 1.25,
          sparkline: [370, 372, 375, 373, 376, 378, 377, 378],
          addedAt: new Date().toISOString()
        },
        { 
          symbol: 'META', 
          name: 'Meta Platforms', 
          price: 485.22, 
          change: -8.33, 
          changePercent: -1.69,
          sparkline: [500, 498, 492, 488, 490, 485, 487, 485],
          addedAt: new Date().toISOString()
        },
        { 
          symbol: 'AMZN', 
          name: 'Amazon.com', 
          price: 178.25, 
          change: 3.42, 
          changePercent: 1.96,
          sparkline: [172, 174, 175, 176, 177, 175, 178, 178],
          addedAt: new Date().toISOString()
        },
      ],
      selectedSymbol: null,
      analysisHistory: {},
      holdings: {},

      addStock: (stock, scopedInfo) =>
        set((state) => {
          // ALWAYS uppercase for consistency
          const symbol = stock.symbol.toUpperCase();
          // Prevent duplicates
          if (state.items.some((item) => item.symbol === symbol)) {
            return state;
          }
          const now = new Date().toISOString();
          return {
            items: [
              ...state.items,
              {
                ...stock,
                symbol,
                addedAt: now,
                // Add scoped info if provided
                ...(scopedInfo && {
                  scopedFrom: scopedInfo.scopedFrom,
                  scopedAt: now,
                  scopedPrice: scopedInfo.scopedPrice,
                  scopedSentiment: scopedInfo.scopedSentiment,
                  scopedSource: scopedInfo.scopedSource,
                }),
              },
            ],
          };
        }),

      removeStock: (symbol) =>
        set((state) => ({
          items: state.items.filter((item) => item.symbol !== symbol),
          selectedSymbol:
            state.selectedSymbol === symbol ? null : state.selectedSymbol,
        })),

      updateStock: (symbol, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.symbol === symbol ? { ...item, ...updates } : item
          ),
        })),

      selectStock: (symbol) =>
        set({ selectedSymbol: symbol }),

      reorderStocks: (fromIndex, toIndex) =>
        set((state) => {
          const items = [...state.items];
          const [removed] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, removed);
          return { items };
        }),

      // Holdings management - ALWAYS use uppercase symbols!
      setShares: (symbol, shares) => {
        const upperSymbol = symbol.toUpperCase();
        set((state) => ({
          holdings: {
            ...state.holdings,
            [upperSymbol]: {
              ...state.holdings[upperSymbol],
              symbol: upperSymbol,
              shares: Math.max(0, shares),
              addedAt:
                state.holdings[upperSymbol]?.addedAt || new Date().toISOString(),
            },
          },
        }));
      },

      setAvgCost: (symbol, avgCost) => {
        const upperSymbol = symbol.toUpperCase();
        set((state) => ({
          holdings: {
            ...state.holdings,
            [upperSymbol]: {
              ...state.holdings[upperSymbol],
              symbol: upperSymbol,
              avgCost,
              shares: state.holdings[upperSymbol]?.shares || 0,
              addedAt:
                state.holdings[upperSymbol]?.addedAt || new Date().toISOString(),
            },
          },
        }));
      },

      getHolding: (symbol) => get().holdings[symbol.toUpperCase()] || null,

      getTotalShares: (symbol) => get().holdings[symbol.toUpperCase()]?.shares || 0,

      getHoldingsWithShares: () => {
        const { holdings } = get();
        return Object.values(holdings).filter((h) => h.shares > 0);
      },

      addAnalysis: (symbol, analysis) =>
        set((state) => {
          const history = state.analysisHistory[symbol] || [];
          return {
            analysisHistory: {
              ...state.analysisHistory,
              [symbol]: [analysis, ...history].slice(0, 10), // Keep last 10
            },
            items: state.items.map((item) =>
              item.symbol === symbol
                ? {
                    ...item,
                    lastAnalysis: {
                      type: analysis.type,
                      timestamp: analysis.timestamp,
                      score: analysis.type === 'quick' ? (analysis as any).score : undefined,
                    },
                  }
                : item
            ),
          };
        }),

      getLatestAnalysis: (symbol) => {
        const history = get().analysisHistory[symbol];
        return history?.[0];
      },

      clearAnalysisHistory: (symbol) =>
        set((state) => ({
          analysisHistory: {
            ...state.analysisHistory,
            [symbol]: [],
          },
        })),
    }),
    {
      name: 'spectrascope-watchlist',
      partialize: (state) => ({
        items: state.items,
        analysisHistory: state.analysisHistory,
        holdings: state.holdings,
      }),
    }
  )
);
