import { useState, useMemo, memo } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Header } from '@/components/layout';
import { Sparkline } from '@/components/charts';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import type { Stock } from '@/types';

interface WatchlistViewProps {
  onSelectStock: (stock: Stock) => void;
  onOpenSettings: () => void;
}

/**
 * WatchlistView - Home screen showing tracked stocks
 * Uses Zustand store for state management
 */
export const WatchlistView = memo(function WatchlistView({
  onSelectStock,
  onOpenSettings,
}: WatchlistViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { items: stocks } = useWatchlistStore();

  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return stocks;
    const query = searchQuery.toLowerCase();
    return stocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query)
    );
  }, [stocks, searchQuery]);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <Header
        title="Watchlist"
        subtitle="Track your investments"
        showSettings
        onSettings={onOpenSettings}
      />

      {/* Search */}
      <div className="px-5 py-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Stock List */}
      <div className="px-5 py-2 space-y-3 pb-32">
        {filteredStocks.map((stock, index) => (
          <StockCard
            key={stock.symbol}
            stock={stock}
            index={index}
            onSelect={() => onSelectStock(stock)}
          />
        ))}

        {filteredStocks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No stocks found</p>
            <p className="text-slate-600 text-sm mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// Stock Card Component
interface StockCardProps {
  stock: Stock;
  index: number;
  onSelect: () => void;
}

const StockCard = memo(function StockCard({
  stock,
  index,
  onSelect,
}: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <button
      onClick={onSelect}
      className="w-full p-4 bg-slate-900/30 hover:bg-slate-800/40 border border-slate-800/50 rounded-2xl transition-all duration-300 hover:scale-[1.01] group animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Symbol Badge */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {stock.symbol.slice(0, 2)}
            </span>
          </div>

          {/* Stock Info */}
          <div className="text-left">
            <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">
              {stock.symbol}
            </h3>
            <p className="text-slate-500 text-sm">{stock.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Sparkline */}
          {stock.sparkline && stock.sparkline.length > 0 && (
            <Sparkline data={stock.sparkline} positive={isPositive} />
          )}

          {/* Price Info */}
          <div className="text-right min-w-[100px]">
            <p className="text-white font-semibold text-lg">
              ${stock.price.toFixed(2)}
            </p>
            <p
              className={`text-sm font-medium flex items-center justify-end gap-1 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              {isPositive ? '+' : ''}
              {stock.changePercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </button>
  );
});

export default WatchlistView;
