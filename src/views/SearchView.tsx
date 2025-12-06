/**
 * SearchView - Stock symbol search with API integration
 *
 * Features:
 * - Real-time search via Polygon or Alpha Vantage
 * - Debounced queries for performance
 * - Popular stocks fallback
 * - Add to watchlist support
 */

import { useState, useCallback, useEffect, memo } from 'react';
import { Search, X, Loader2, Plus, Check, TrendingUp, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { searchTickers } from '@/services/api/polygon';
import { debounce } from '@/utils/debounce';

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
}

interface SearchViewProps {
  onSelectStock: (symbol: string) => void;
  onBack: () => void;
}

// Popular stocks for suggestions when no API key or no query
const POPULAR_STOCKS: SearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Stock' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Stock' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'Stock' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'Stock' },
  { symbol: 'DIS', name: 'The Walt Disney Company', type: 'Stock' },
];

export const SearchView = memo(function SearchView({
  onSelectStock,
  onBack,
}: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getApiKey } = useApiKeysStore();
  const polygonKey = getApiKey('polygon');
  const hasApiKey = !!polygonKey;

  const { items: watchlistItems, addStock } = useWatchlistStore();

  // Check if symbol is already in watchlist
  const isInWatchlist = useCallback(
    (symbol: string) => watchlistItems.some((item) => item.symbol === symbol),
    [watchlistItems]
  );

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 1) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let searchResults: SearchResult[] = [];

        // Try Polygon (real-time search)
        if (polygonKey) {
          console.log('Searching with Polygon.io...');
          searchResults = await searchTickers(searchQuery, polygonKey);
        }
        // No API key - filter popular stocks
        else {
          searchResults = POPULAR_STOCKS.filter(
            (s) =>
              s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setResults(searchResults);
      } catch (err: any) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [polygonKey]
  );

  // Trigger search when query changes
  useEffect(() => {
    if (query.trim()) {
      setIsLoading(true);
      performSearch(query);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [query, performSearch]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  const handleSelectStock = useCallback(
    (symbol: string) => {
      onSelectStock(symbol);
    },
    [onSelectStock]
  );

  const handleAddToWatchlist = useCallback(
    (result: SearchResult, e: React.MouseEvent) => {
      e.stopPropagation();
      addStock({
        symbol: result.symbol,
        name: result.name,
        price: 0, // Will be updated when data loads
        change: 0,
        changePercent: 0,
      });
    },
    [addStock]
  );

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <Header
        title="Search"
        subtitle="Find stocks to analyze"
        showBack
        onBack={onBack}
      />

      {/* Search Input */}
      <div className="px-5 py-4">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search stocks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="input-field pl-12 pr-12 text-lg"
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700/50 rounded-full transition-colors"
            >
              <X size={18} className="text-slate-500" />
            </button>
          )}
        </div>

        {/* API Status */}
        {!hasApiKey && (
          <p className="text-amber-400 text-sm mt-2">
            Add API key in Settings to search all stocks
          </p>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="px-5 py-4">
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center">
              <p className="text-rose-400">{error}</p>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && !error && results.length > 0 && (
          <div className="px-5">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
              {results.map((result) => (
                <div
                  key={result.symbol}
                  onClick={() => handleSelectStock(result.symbol)}
                  className="flex items-center justify-between p-4 hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">
                        {result.symbol}
                      </span>
                      <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                        {result.type || 'Stock'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm truncate">
                      {result.name}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleAddToWatchlist(result, e)}
                    className={`ml-4 p-2 rounded-lg transition-colors ${
                      isInWatchlist(result.symbol)
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {isInWatchlist(result.symbol) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && query.length > 0 && results.length === 0 && (
          <div className="px-5 pb-4">
            <div className="bg-slate-900/20 border border-dashed border-slate-700/50 rounded-2xl p-8 text-center">
              <Search size={32} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400 font-medium">
                No results for "{query}"
              </p>
              <p className="text-slate-600 text-sm mt-1">
                Try searching for a different symbol
              </p>
            </div>
          </div>
        )}

        {/* Popular Stocks (when no query) */}
        {!isLoading && !query && (
          <div className="px-5 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-slate-500" />
              <h3 className="text-slate-400 font-medium text-sm">
                Popular Stocks
              </h3>
            </div>
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
              {POPULAR_STOCKS.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => handleSelectStock(stock.symbol)}
                  className="flex items-center justify-between p-4 hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div>
                    <span className="text-white font-semibold">
                      {stock.symbol}
                    </span>
                    <p className="text-slate-400 text-sm">{stock.name}</p>
                  </div>
                  <button
                    onClick={(e) => handleAddToWatchlist(stock, e)}
                    className={`p-2 rounded-lg transition-colors ${
                      isInWatchlist(stock.symbol)
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {isInWatchlist(stock.symbol) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestion Hint */}
        {!query && (
          <div className="px-5 pb-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20">
                  <Sparkles size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-blue-200 font-medium text-sm">Pro Tip</p>
                  <p className="text-blue-200/70 text-xs mt-1">
                    Select a stock to run AI-powered analysis with SpectraScope
                    Engine
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default SearchView;
