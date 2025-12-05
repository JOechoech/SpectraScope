import { useState, useMemo, memo, useCallback } from 'react';
import { Search, TrendingUp, History, Sparkles, X } from 'lucide-react';
import { Header } from '@/components/layout';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface SearchViewProps {
  onSelectStock: (symbol: string) => void;
  onBack: () => void;
}

// Popular stocks for suggestions
const popularStocks: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 189.84, change: 2.35, changePercent: 1.25 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.91, change: 4.21, changePercent: 1.12 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: 1.92, changePercent: 1.37 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: -1.45, changePercent: -0.81 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 495.22, change: 12.34, changePercent: 2.56 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 505.35, change: 8.76, changePercent: 1.76 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -3.25, changePercent: -1.29 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 362.45, change: 1.23, changePercent: 0.34 },
];

/**
 * SearchView - Stock symbol search with suggestions
 * Provides quick access to popular stocks and search history
 */
export const SearchView = memo(function SearchView({
  onSelectStock,
  onBack,
}: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [recentSearches] = useState<string[]>(['AAPL', 'TSLA', 'NVDA']);

  const filteredStocks = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return popularStocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
  }, [query]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
  }, []);

  const handleQuickSelect = useCallback((symbol: string) => {
    onSelectStock(symbol);
  }, [onSelectStock]);

  return (
    <div className="min-h-screen bg-black">
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
            placeholder="Search symbols or company names..."
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
      </div>

      {/* Search Results */}
      {query && filteredStocks.length > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden">
            {filteredStocks.map((stock, index) => (
              <SearchResultItem
                key={stock.symbol}
                stock={stock}
                onSelect={() => onSelectStock(stock.symbol)}
                isLast={index === filteredStocks.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {query && filteredStocks.length === 0 && (
        <div className="px-5 pb-4">
          <div className="bg-slate-900/20 border border-dashed border-slate-700/50 rounded-2xl p-8 text-center">
            <Search size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">No results found</p>
            <p className="text-slate-600 text-sm mt-1">
              Try searching for a different symbol
            </p>
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="px-5 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-slate-500" />
            <h3 className="text-slate-400 font-medium text-sm">Recent Searches</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((symbol) => (
              <button
                key={symbol}
                onClick={() => handleQuickSelect(symbol)}
                className="px-4 py-2 bg-slate-900/30 border border-slate-800/50 rounded-xl text-white font-medium hover:bg-slate-800/50 transition-colors"
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Stocks */}
      {!query && (
        <div className="px-5 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-slate-500" />
            <h3 className="text-slate-400 font-medium text-sm">Popular Stocks</h3>
          </div>
          <div className="space-y-2">
            {popularStocks.slice(0, 5).map((stock, index) => (
              <PopularStockItem
                key={stock.symbol}
                stock={stock}
                index={index}
                onSelect={() => onSelectStock(stock.symbol)}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestion Hint */}
      {!query && (
        <div className="px-5 pb-24">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20">
                <Sparkles size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-blue-200 font-medium text-sm">Pro Tip</p>
                <p className="text-blue-200/70 text-xs mt-1">
                  Select a stock to run AI-powered analysis with SpectraScope Engine
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Search Result Item Component
interface SearchResultItemProps {
  stock: Stock;
  onSelect: () => void;
  isLast: boolean;
}

const SearchResultItem = memo(function SearchResultItem({
  stock,
  onSelect,
  isLast,
}: SearchResultItemProps) {
  const isPositive = stock.change >= 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors ${
        !isLast ? 'border-b border-slate-800/50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
          <span className="text-white font-bold text-xs">
            {stock.symbol.slice(0, 2)}
          </span>
        </div>
        <div className="text-left">
          <h3 className="text-white font-semibold">{stock.symbol}</h3>
          <p className="text-slate-500 text-sm">{stock.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-white font-semibold">${stock.price.toFixed(2)}</p>
        <p className={`text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </p>
      </div>
    </button>
  );
});

// Popular Stock Item Component
interface PopularStockItemProps {
  stock: Stock;
  index: number;
  onSelect: () => void;
}

const PopularStockItem = memo(function PopularStockItem({
  stock,
  index,
  onSelect,
}: PopularStockItemProps) {
  const isPositive = stock.change >= 0;

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between p-3 bg-slate-900/30 hover:bg-slate-800/40 border border-slate-800/50 rounded-xl transition-all animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="text-slate-600 font-medium w-6">{index + 1}</span>
        <div className="text-left">
          <h3 className="text-white font-medium">{stock.symbol}</h3>
          <p className="text-slate-500 text-xs">{stock.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-white font-medium">${stock.price.toFixed(2)}</p>
        <p className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </p>
      </div>
    </button>
  );
});

export default SearchView;
