/**
 * ScopeSuggest - Discover trending stocks by sector
 *
 * Features:
 * - Sector buttons for quick discovery (Tech, Finance, Healthcare, etc.)
 * - Shows trending/popular stocks in each sector
 * - Quick "Add to Watchlist" functionality
 */

import { useState, memo } from 'react';
import { TrendingUp, Plus, Check, Sparkles } from 'lucide-react';
import { useWatchlistStore } from '@/stores/useWatchlistStore';

// ═══════════════════════════════════════════════════════════════════════════
// SECTOR DATA
// ═══════════════════════════════════════════════════════════════════════════

interface SectorStock {
  symbol: string;
  name: string;
  description?: string;
}

interface Sector {
  id: string;
  name: string;
  icon: string;
  color: string;
  stocks: SectorStock[];
}

const SECTORS: Sector[] = [
  {
    id: 'tech',
    name: 'Tech',
    icon: '💻',
    color: '#3b82f6',
    stocks: [
      { symbol: 'AAPL', name: 'Apple Inc.', description: 'Consumer electronics' },
      { symbol: 'MSFT', name: 'Microsoft', description: 'Enterprise software' },
      { symbol: 'GOOGL', name: 'Alphabet', description: 'Search & cloud' },
      { symbol: 'NVDA', name: 'NVIDIA', description: 'AI chips leader' },
      { symbol: 'META', name: 'Meta', description: 'Social & VR' },
      { symbol: 'AMZN', name: 'Amazon', description: 'E-commerce & cloud' },
    ],
  },
  {
    id: 'ai',
    name: 'AI',
    icon: '🤖',
    color: '#8b5cf6',
    stocks: [
      { symbol: 'NVDA', name: 'NVIDIA', description: 'GPU leader' },
      { symbol: 'AMD', name: 'AMD', description: 'AI accelerators' },
      { symbol: 'MSFT', name: 'Microsoft', description: 'OpenAI partner' },
      { symbol: 'GOOGL', name: 'Alphabet', description: 'Gemini AI' },
      { symbol: 'PLTR', name: 'Palantir', description: 'AI analytics' },
      { symbol: 'CRM', name: 'Salesforce', description: 'Einstein AI' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '🏦',
    color: '#10b981',
    stocks: [
      { symbol: 'JPM', name: 'JPMorgan', description: 'Largest US bank' },
      { symbol: 'V', name: 'Visa', description: 'Payments network' },
      { symbol: 'MA', name: 'Mastercard', description: 'Global payments' },
      { symbol: 'GS', name: 'Goldman Sachs', description: 'Investment bank' },
      { symbol: 'BAC', name: 'Bank of America', description: 'Retail banking' },
      { symbol: 'BRK.B', name: 'Berkshire', description: 'Warren Buffett' },
    ],
  },
  {
    id: 'health',
    name: 'Health',
    icon: '🏥',
    color: '#f43f5e',
    stocks: [
      { symbol: 'UNH', name: 'UnitedHealth', description: 'Health insurance' },
      { symbol: 'JNJ', name: 'Johnson & Johnson', description: 'Pharma & devices' },
      { symbol: 'LLY', name: 'Eli Lilly', description: 'Weight loss drugs' },
      { symbol: 'PFE', name: 'Pfizer', description: 'Vaccines & pharma' },
      { symbol: 'ABBV', name: 'AbbVie', description: 'Immunology' },
      { symbol: 'MRK', name: 'Merck', description: 'Oncology leader' },
    ],
  },
  {
    id: 'ev',
    name: 'EV',
    icon: '⚡',
    color: '#f59e0b',
    stocks: [
      { symbol: 'TSLA', name: 'Tesla', description: 'EV & energy' },
      { symbol: 'RIVN', name: 'Rivian', description: 'Electric trucks' },
      { symbol: 'LCID', name: 'Lucid', description: 'Luxury EVs' },
      { symbol: 'NIO', name: 'NIO', description: 'China EV leader' },
      { symbol: 'F', name: 'Ford', description: 'Lightning & Mach-E' },
      { symbol: 'GM', name: 'GM', description: 'Ultium platform' },
    ],
  },
  {
    id: 'crypto',
    name: 'Crypto',
    icon: '₿',
    color: '#f97316',
    stocks: [
      { symbol: 'COIN', name: 'Coinbase', description: 'Crypto exchange' },
      { symbol: 'MSTR', name: 'MicroStrategy', description: 'Bitcoin treasury' },
      { symbol: 'MARA', name: 'Marathon', description: 'Bitcoin mining' },
      { symbol: 'RIOT', name: 'Riot', description: 'BTC mining' },
      { symbol: 'SQ', name: 'Block', description: 'Cash App crypto' },
      { symbol: 'HOOD', name: 'Robinhood', description: 'Crypto trading' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ScopeSuggestProps {
  onSelectStock: (symbol: string) => void;
}

export const ScopeSuggest = memo(function ScopeSuggest({
  onSelectStock,
}: ScopeSuggestProps) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const { addStock, items: watchlistItems } = useWatchlistStore();
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);

  const isInWatchlist = (symbol: string) =>
    watchlistItems.some((item) => item.symbol === symbol);

  const handleAddToWatchlist = (stock: SectorStock) => {
    if (!isInWatchlist(stock.symbol)) {
      addStock({
        symbol: stock.symbol,
        name: stock.name,
        price: 0,
        change: 0,
        changePercent: 0,
      });
      setRecentlyAdded((prev) => [...prev, stock.symbol]);
      setTimeout(() => {
        setRecentlyAdded((prev) => prev.filter((s) => s !== stock.symbol));
      }, 2000);
    }
  };

  const activeSector = SECTORS.find((s) => s.id === selectedSector);

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
          <Sparkles size={14} className="text-purple-400" />
        </div>
        <span className="text-white font-medium text-sm">Scope Suggest</span>
        <span className="text-slate-500 text-xs">Discover by sector</span>
      </div>

      {/* Sector Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SECTORS.map((sector) => (
          <button
            key={sector.id}
            onClick={() => setSelectedSector(
              selectedSector === sector.id ? null : sector.id
            )}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
              selectedSector === sector.id
                ? 'ring-2 ring-offset-2 ring-offset-black'
                : 'hover:bg-slate-800/50'
            }`}
            style={{
              background: selectedSector === sector.id
                ? `${sector.color}30`
                : 'rgba(30, 41, 59, 0.5)',
              borderColor: selectedSector === sector.id ? sector.color : 'transparent',
              // Ring color set via CSS variable
              ['--tw-ring-color' as string]: selectedSector === sector.id ? sector.color : undefined,
            }}
          >
            <span className="text-base">{sector.icon}</span>
            <span
              className={`text-sm font-medium ${
                selectedSector === sector.id ? 'text-white' : 'text-slate-400'
              }`}
            >
              {sector.name}
            </span>
          </button>
        ))}
      </div>

      {/* Expanded Stock List */}
      {activeSector && (
        <div className="mt-3 bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
          {/* Sector Header */}
          <div
            className="px-4 py-2.5 border-b border-slate-800/50 flex items-center gap-2"
            style={{ background: `${activeSector.color}15` }}
          >
            <span className="text-lg">{activeSector.icon}</span>
            <span className="text-white font-medium">{activeSector.name}</span>
            <span className="text-slate-500 text-sm">• Top picks</span>
          </div>

          {/* Stock Grid */}
          <div className="p-3 grid grid-cols-2 gap-2">
            {activeSector.stocks.map((stock) => {
              const inWatchlist = isInWatchlist(stock.symbol);
              const justAdded = recentlyAdded.includes(stock.symbol);

              return (
                <div
                  key={stock.symbol}
                  className="bg-slate-800/50 rounded-xl p-3 flex items-start justify-between group hover:bg-slate-700/50 transition-colors"
                >
                  <button
                    onClick={() => onSelectStock(stock.symbol)}
                    className="flex-1 text-left"
                  >
                    <div className="text-white font-semibold text-sm">
                      {stock.symbol}
                    </div>
                    <div className="text-slate-400 text-xs truncate">
                      {stock.description}
                    </div>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToWatchlist(stock);
                    }}
                    disabled={inWatchlist || justAdded}
                    className={`p-1.5 rounded-lg transition-all ${
                      inWatchlist || justAdded
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400'
                    }`}
                  >
                    {inWatchlist || justAdded ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* View All Trending */}
          <div className="px-3 pb-3">
            <button
              className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
              onClick={() => setSelectedSector(null)}
            >
              <TrendingUp size={14} />
              More sectors coming soon
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ScopeSuggest;
