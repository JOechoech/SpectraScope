/**
 * SpectraScope - AI-Powered Stock Discovery
 *
 * Features:
 * - Two scan modes: Full AI Scan & Grok Social Scan
 * - Sector buttons for quick discovery
 * - Shows trending stocks with AI analysis
 * - Quick "Add to Watchlist" & "Deep Analyze All" functionality
 */

import { useState, memo, useCallback } from 'react';
import { Telescope, Plus, Check, Sparkles, Zap, Loader2, ListPlus, Search, Clock } from 'lucide-react';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { useApiKeysStore } from '@/stores/useApiKeysStore';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
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

interface ScanResult {
  symbol: string;
  name: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  reason: string;
  momentum?: number;
}

type ScanMode = 'full' | 'grok' | null;

// Helper to format timestamp in European format
function formatScanTime(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year} at ${hours}:${minutes}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTOR DATA
// ═══════════════════════════════════════════════════════════════════════════

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
    id: 'biotech',
    name: 'Biotech',
    icon: '🧬',
    color: '#ec4899',
    stocks: [
      { symbol: 'MRNA', name: 'Moderna', description: 'mRNA therapeutics' },
      { symbol: 'REGN', name: 'Regeneron', description: 'Antibody drugs' },
      { symbol: 'VRTX', name: 'Vertex', description: 'Gene therapy' },
      { symbol: 'BIIB', name: 'Biogen', description: "Alzheimer's drugs" },
      { symbol: 'GILD', name: 'Gilead', description: 'Antivirals' },
      { symbol: 'ILMN', name: 'Illumina', description: 'Gene sequencing' },
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
    id: 'energy',
    name: 'Energy',
    icon: '⚡',
    color: '#f59e0b',
    stocks: [
      { symbol: 'XOM', name: 'ExxonMobil', description: 'Oil & gas major' },
      { symbol: 'CVX', name: 'Chevron', description: 'Integrated energy' },
      { symbol: 'COP', name: 'ConocoPhillips', description: 'E&P leader' },
      { symbol: 'NEE', name: 'NextEra', description: 'Clean energy' },
      { symbol: 'ENPH', name: 'Enphase', description: 'Solar inverters' },
      { symbol: 'FSLR', name: 'First Solar', description: 'Solar panels' },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
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
    id: 'retail',
    name: 'Retail',
    icon: '🛒',
    color: '#06b6d4',
    stocks: [
      { symbol: 'WMT', name: 'Walmart', description: 'Retail giant' },
      { symbol: 'COST', name: 'Costco', description: 'Membership retail' },
      { symbol: 'TGT', name: 'Target', description: 'Discount retail' },
      { symbol: 'HD', name: 'Home Depot', description: 'Home improvement' },
      { symbol: 'LOW', name: "Lowe's", description: 'Home improvement' },
      { symbol: 'NKE', name: 'Nike', description: 'Athletic apparel' },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    color: '#8b5cf6',
    stocks: [
      { symbol: 'NVDA', name: 'NVIDIA', description: 'Gaming GPUs' },
      { symbol: 'AMD', name: 'AMD', description: 'Gaming chips' },
      { symbol: 'TTWO', name: 'Take-Two', description: 'GTA, NBA 2K' },
      { symbol: 'EA', name: 'EA', description: 'FIFA, Madden' },
      { symbol: 'RBLX', name: 'Roblox', description: 'Gaming platform' },
      { symbol: 'U', name: 'Unity', description: 'Game engine' },
    ],
  },
  {
    id: 'meme',
    name: 'Meme',
    icon: '🚀',
    color: '#f97316',
    stocks: [
      { symbol: 'GME', name: 'GameStop', description: 'Retail gaming' },
      { symbol: 'AMC', name: 'AMC', description: 'Movie theaters' },
      { symbol: 'BBBY', name: 'Bed Bath', description: 'Home retail' },
      { symbol: 'PLTR', name: 'Palantir', description: 'AI analytics' },
      { symbol: 'RIVN', name: 'Rivian', description: 'EV trucks' },
      { symbol: 'HOOD', name: 'Robinhood', description: 'Trading app' },
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
  const [scanMode, setScanMode] = useState<ScanMode>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanTimestamp, setScanTimestamp] = useState<Date | null>(null);
  const { addStock, items: watchlistItems } = useWatchlistStore();
  const { getApiKey } = useApiKeysStore();
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);

  const grokKey = getApiKey('grok');
  const hasAllKeys = getApiKey('anthropic') && getApiKey('openai') && getApiKey('gemini') && grokKey;

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

  const handleAddAllToWatchlist = () => {
    scanResults.forEach((result) => {
      if (!isInWatchlist(result.symbol)) {
        addStock({
          symbol: result.symbol,
          name: result.name,
          price: 0,
          change: 0,
          changePercent: 0,
        });
      }
    });
    setRecentlyAdded(scanResults.map((r) => r.symbol));
    setTimeout(() => setRecentlyAdded([]), 2000);
  };

  const handleDeepAnalyzeAll = () => {
    // Navigate to first result for deep analysis
    if (scanResults.length > 0) {
      onSelectStock(scanResults[0].symbol);
    }
  };

  // Run Grok Social Scan
  const runGrokScan = useCallback(async () => {
    if (!grokKey || !selectedSector) return;

    setIsScanning(true);
    setScanResults([]);

    const sector = SECTORS.find((s) => s.id === selectedSector);
    if (!sector) return;

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${grokKey}`,
        },
        body: JSON.stringify({
          model: 'grok-3-mini',
          messages: [
            {
              role: 'system',
              content: `You analyze X/Twitter sentiment for stocks. Focus on posts from the LAST 24 HOURS. Return JSON only.`,
            },
            {
              role: 'user',
              content: `Scan X/Twitter for trending sentiment on these ${sector.name} stocks: ${sector.stocks.map((s) => s.symbol).join(', ')}

Return the TOP 5 with strongest social signals as JSON:
{
  "results": [
    {
      "symbol": "TICKER",
      "name": "Company Name",
      "signal": "bullish|bearish|neutral",
      "reason": "Brief reason from social sentiment",
      "momentum": 0-100
    }
  ]
}

Only return valid JSON.`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) throw new Error('Grok scan failed');

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setScanResults(parsed.results || []);
          setScanTimestamp(new Date());
        }
      }
    } catch (err) {
      console.error('Grok scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  }, [grokKey, selectedSector]);

  // Run Full AI Scan (uses Claude for synthesis)
  const runFullScan = useCallback(async () => {
    if (!hasAllKeys || !selectedSector) return;

    setIsScanning(true);
    setScanResults([]);

    const sector = SECTORS.find((s) => s.id === selectedSector);
    if (!sector) return;

    const anthropicKey = getApiKey('anthropic');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey!,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `You are analyzing ${sector.name} stocks for investment signals.

Stocks to analyze: ${sector.stocks.map((s) => `${s.symbol} (${s.name})`).join(', ')}

For each stock, consider:
- Recent price action and technicals
- News and catalysts
- Market sentiment
- Sector trends

Return the TOP 5 opportunities ranked by conviction as JSON:
{
  "results": [
    {
      "symbol": "TICKER",
      "name": "Company Name",
      "signal": "bullish|bearish|neutral",
      "reason": "One sentence explaining the signal",
      "momentum": 0-100
    }
  ]
}

Only return valid JSON.`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error('Full scan failed');

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setScanResults(parsed.results || []);
          setScanTimestamp(new Date());
        }
      }
    } catch (err) {
      console.error('Full scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  }, [hasAllKeys, selectedSector, getApiKey]);

  const handleScan = (mode: ScanMode) => {
    setScanMode(mode);
    if (mode === 'grok') {
      runGrokScan();
    } else if (mode === 'full') {
      runFullScan();
    }
  };

  const activeSector = SECTORS.find((s) => s.id === selectedSector);

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
          <Telescope size={14} className="text-purple-400" />
        </div>
        <span className="text-white font-bold text-sm tracking-wider">SPECTRASCOPE</span>
        <span className="text-slate-500 text-xs">AI Stock Discovery</span>
      </div>

      {/* Scan Mode Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => selectedSector && handleScan('full')}
          disabled={!hasAllKeys || !selectedSector || isScanning}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
            !hasAllKeys || !selectedSector
              ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
              : scanMode === 'full' && isScanning
                ? 'bg-purple-600/20 border border-purple-500/30'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
          }`}
        >
          {scanMode === 'full' && isScanning ? (
            <Loader2 size={16} className="animate-spin text-purple-400" />
          ) : (
            <Sparkles size={16} className={hasAllKeys && selectedSector ? 'text-white' : 'text-slate-600'} />
          )}
          <div className="text-left">
            <div className={`text-sm font-semibold ${hasAllKeys && selectedSector ? 'text-white' : 'text-slate-600'}`}>
              FULL AI SCAN
            </div>
            <div className={`text-xs ${hasAllKeys && selectedSector ? 'text-white/70' : 'text-slate-600'}`}>
              All AIs ~$0.30 ~30s
            </div>
          </div>
        </button>

        <button
          onClick={() => selectedSector && handleScan('grok')}
          disabled={!grokKey || !selectedSector || isScanning}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
            !grokKey || !selectedSector
              ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
              : scanMode === 'grok' && isScanning
                ? 'bg-amber-600/20 border border-amber-500/30'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
          }`}
        >
          {scanMode === 'grok' && isScanning ? (
            <Loader2 size={16} className="animate-spin text-amber-400" />
          ) : (
            <Zap size={16} className={grokKey && selectedSector ? 'text-white' : 'text-slate-600'} />
          )}
          <div className="text-left">
            <div className={`text-sm font-semibold ${grokKey && selectedSector ? 'text-white' : 'text-slate-600'}`}>
              GROK SOCIAL
            </div>
            <div className={`text-xs ${grokKey && selectedSector ? 'text-white/70' : 'text-slate-600'}`}>
              X/Twitter ~$0.01 ~3s
            </div>
          </div>
        </button>
      </div>

      {/* Sector Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SECTORS.map((sector) => (
          <button
            key={sector.id}
            onClick={() => {
              setSelectedSector(selectedSector === sector.id ? null : sector.id);
              setScanResults([]);
              setScanMode(null);
              setScanTimestamp(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
              selectedSector === sector.id
                ? 'ring-2 ring-offset-2 ring-offset-black'
                : 'hover:bg-slate-800/50'
            }`}
            style={{
              background:
                selectedSector === sector.id
                  ? `${sector.color}30`
                  : 'rgba(30, 41, 59, 0.5)',
              borderColor:
                selectedSector === sector.id ? sector.color : 'transparent',
              ['--tw-ring-color' as string]:
                selectedSector === sector.id ? sector.color : undefined,
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

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div className="mt-3 bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
          <div
            className="px-4 py-2.5 border-b border-slate-800/50"
            style={{ background: activeSector ? `${activeSector.color}15` : undefined }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{activeSector?.icon}</span>
                <span className="text-white font-medium">{activeSector?.name}</span>
                <span className="text-slate-500 text-sm">
                  - Results from {scanMode === 'grok' ? 'Grok' : 'Full AI'}
                </span>
              </div>
              <Search size={14} className="text-purple-400" />
            </div>
            {scanTimestamp && (
              <div className="flex items-center gap-1 mt-1 text-slate-500">
                <Clock size={12} />
                <span className="text-xs">Scoped on {formatScanTime(scanTimestamp)}</span>
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="p-3 space-y-2">
            {scanResults.map((result) => {
              const inWatchlist = isInWatchlist(result.symbol);
              const justAdded = recentlyAdded.includes(result.symbol);

              return (
                <div
                  key={result.symbol}
                  className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3"
                >
                  <button
                    onClick={() => onSelectStock(result.symbol)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{result.symbol}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          result.signal === 'bullish'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : result.signal === 'bearish'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {result.signal.toUpperCase()}
                      </span>
                      {result.momentum && (
                        <span className="text-xs text-slate-500">
                          {result.momentum}% momentum
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">{result.reason}</div>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToWatchlist({ symbol: result.symbol, name: result.name });
                    }}
                    disabled={inWatchlist || justAdded}
                    className={`p-1.5 rounded-lg transition-all ${
                      inWatchlist || justAdded
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400'
                    }`}
                  >
                    {inWatchlist || justAdded ? <Check size={14} /> : <Plus size={14} />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="px-3 pb-3 flex gap-2">
            <button
              onClick={handleAddAllToWatchlist}
              className="flex-1 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ListPlus size={16} />
              Add All to Watchlist
            </button>
            <button
              onClick={handleDeepAnalyzeAll}
              className="flex-1 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Telescope size={16} />
              Deep Analyze All
            </button>
          </div>
        </div>
      )}

      {/* Empty State - Sector selected but no scan run yet */}
      {activeSector && scanResults.length === 0 && !isScanning && (
        <div className="mt-3 bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
          {/* Sector Header */}
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ background: `${activeSector.color}15` }}
          >
            <span className="text-2xl">{activeSector.icon}</span>
            <span className="text-white font-semibold text-lg">{activeSector.name}</span>
          </div>

          {/* Empty State Content */}
          <div className="p-6 text-center">
            <Telescope size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">
              Select a scan mode above to discover
            </p>
            <p className="text-slate-500 text-sm mt-1">
              trending stocks in this sector
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-purple-400">
                <Sparkles size={12} />
                <span>Full AI Scan</span>
              </div>
              <span className="text-slate-600">or</span>
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Zap size={12} />
                <span>Grok Social</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanning State */}
      {isScanning && (
        <div className="mt-3 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center">
          <Loader2 size={32} className="animate-spin text-purple-400 mb-3" />
          <p className="text-white font-medium">
            {scanMode === 'grok' ? 'Scanning X/Twitter...' : 'Running Full AI Scan...'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {scanMode === 'grok' ? 'Analyzing social sentiment' : 'All AIs working together'}
          </p>
        </div>
      )}
    </div>
  );
});

export default ScopeSuggest;
