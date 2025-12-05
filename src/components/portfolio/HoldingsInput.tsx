/**
 * HoldingsInput - Input for tracking shares owned
 *
 * Features:
 * - Add/edit number of shares
 * - Optional average cost basis
 * - Shows current value and P/L
 */

import { useState, useEffect } from 'react';
import { Briefcase, DollarSign } from 'lucide-react';
import { useWatchlistStore } from '@/stores/useWatchlistStore';

interface HoldingsInputProps {
  symbol: string;
  currentPrice: number;
}

export function HoldingsInput({ symbol, currentPrice }: HoldingsInputProps) {
  const { holdings, setShares, setAvgCost } = useWatchlistStore();
  const holding = holdings[symbol];

  const [localShares, setLocalShares] = useState(holding?.shares || 0);
  const [localAvgCost, setLocalAvgCost] = useState(holding?.avgCost || 0);
  const [isEditing, setIsEditing] = useState(false);

  // Sync with store
  useEffect(() => {
    setLocalShares(holding?.shares || 0);
    setLocalAvgCost(holding?.avgCost || 0);
  }, [holding]);

  const handleSave = () => {
    setShares(symbol, localShares);
    if (localAvgCost > 0) {
      setAvgCost(symbol, localAvgCost);
    }
    setIsEditing(false);
  };

  const shares = holding?.shares || 0;
  const avgCost = holding?.avgCost || 0;
  const totalValue = shares * currentPrice;
  const totalCost = shares * (avgCost || currentPrice);
  const profitLoss = avgCost > 0 ? totalValue - totalCost : 0;
  const profitLossPercent =
    avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;

  // Empty state - show "Add to Portfolio" button
  if (!isEditing && shares === 0) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full p-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-2"
      >
        <Briefcase className="w-4 h-4" />
        Add to Portfolio
      </button>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">Your Holdings</span>
        </div>

        {/* Shares Input */}
        <div>
          <label className="text-slate-400 text-sm mb-1 block">
            Shares Owned
          </label>
          <input
            type="number"
            value={localShares || ''}
            onChange={(e) => setLocalShares(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 50"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Average Cost Input (Optional) */}
        <div>
          <label className="text-slate-400 text-sm mb-1 block">
            Average Cost (optional)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="number"
              value={localAvgCost || ''}
              onChange={(e) => setLocalAvgCost(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 150.00"
              step="0.01"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <p className="text-slate-500 text-xs mt-1">Add to track profit/loss</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => {
              setLocalShares(holding?.shares || 0);
              setLocalAvgCost(holding?.avgCost || 0);
              setIsEditing(false);
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div
      onClick={() => setIsEditing(true)}
      className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 cursor-pointer hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">Your Holdings</span>
        </div>
        <span className="text-slate-400 text-sm">Tap to edit</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-slate-400 text-sm">Shares</p>
          <p className="text-white text-lg font-semibold">
            {shares.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Value</p>
          <p className="text-white text-lg font-semibold">
            $
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {avgCost > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-sm">
              Avg Cost: ${avgCost.toFixed(2)}
            </p>
          </div>
          <div
            className={`text-right ${
              profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <p className="font-semibold">
              {profitLoss >= 0 ? '+' : ''}
              {profitLossPercent.toFixed(2)}%
            </p>
            <p className="text-sm">
              {profitLoss >= 0 ? '+' : ''}$
              {profitLoss.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HoldingsInput;
