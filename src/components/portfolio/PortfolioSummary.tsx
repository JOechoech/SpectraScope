/**
 * PortfolioSummary - Shows total portfolio value and projections
 *
 * Features:
 * - Total portfolio value
 * - Profit/loss tracking
 * - AI projections (bull/base/bear) when available
 * - Holdings breakdown
 */

import { useMemo } from 'react';
import { Briefcase, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import type { StockQuote, Scenario } from '@/types';

interface AnalysisWithScenarios {
  bull: Scenario;
  base: Scenario;
  bear: Scenario;
}

interface PortfolioSummaryProps {
  quotes: Map<string, StockQuote>;
  analyses?: Map<string, AnalysisWithScenarios>;
}

export function PortfolioSummary({ quotes, analyses }: PortfolioSummaryProps) {
  const { holdings } = useWatchlistStore();

  const portfolio = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    const positions: Array<{
      symbol: string;
      shares: number;
      value: number;
      weight: number;
    }> = [];

    // Calculate current values
    Object.values(holdings).forEach((holding) => {
      if (holding.shares > 0) {
        const quote = quotes.get(holding.symbol);
        if (quote) {
          const value = holding.shares * quote.price;
          totalValue += value;

          if (holding.avgCost) {
            totalCost += holding.shares * holding.avgCost;
          }

          positions.push({
            symbol: holding.symbol,
            shares: holding.shares,
            value,
            weight: 0, // Calculate after total
          });
        }
      }
    });

    // Calculate weights
    positions.forEach((p) => {
      p.weight = totalValue > 0 ? (p.value / totalValue) * 100 : 0;
    });

    // Sort by value
    positions.sort((a, b) => b.value - a.value);

    // Calculate projected values using AI analyses
    let bullProjection = 0;
    let baseProjection = 0;
    let bearProjection = 0;
    let analysisCount = 0;

    if (analyses && analyses.size > 0) {
      positions.forEach((pos) => {
        const analysis = analyses.get(pos.symbol);
        const quote = quotes.get(pos.symbol);

        if (analysis && quote) {
          analysisCount++;

          const bullTarget = parsePriceTarget(
            analysis.bull.priceTarget,
            quote.price
          );
          const baseTarget = parsePriceTarget(
            analysis.base.priceTarget,
            quote.price
          );
          const bearTarget = parsePriceTarget(
            analysis.bear.priceTarget,
            quote.price
          );

          bullProjection += pos.shares * bullTarget;
          baseProjection += pos.shares * baseTarget;
          bearProjection += pos.shares * bearTarget;
        } else {
          // No analysis - assume current price
          bullProjection += pos.value;
          baseProjection += pos.value;
          bearProjection += pos.value;
        }
      });
    }

    return {
      totalValue,
      totalCost,
      profitLoss: totalCost > 0 ? totalValue - totalCost : 0,
      profitLossPercent:
        totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      positions,
      projections:
        analysisCount > 0
          ? {
              bull: bullProjection,
              base: baseProjection,
              bear: bearProjection,
              bullChange: ((bullProjection - totalValue) / totalValue) * 100,
              baseChange: ((baseProjection - totalValue) / totalValue) * 100,
              bearChange: ((bearProjection - totalValue) / totalValue) * 100,
              coveragePercent: (analysisCount / positions.length) * 100,
            }
          : null,
    };
  }, [holdings, quotes, analyses]);

  if (portfolio.positions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-4 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-semibold">Portfolio Summary</h3>
      </div>

      {/* Current Value */}
      <div className="mb-4">
        <p className="text-slate-400 text-sm">Total Value</p>
        <p className="text-3xl font-bold text-white">
          $
          {portfolio.totalValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        {portfolio.totalCost > 0 && (
          <p
            className={`text-sm ${
              portfolio.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {portfolio.profitLoss >= 0 ? '+' : ''}$
            {portfolio.profitLoss.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            ({portfolio.profitLoss >= 0 ? '+' : ''}
            {portfolio.profitLossPercent.toFixed(2)}%)
          </p>
        )}
      </div>

      {/* Projections */}
      {portfolio.projections && (
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">AI Projections (6M)</p>
            <span className="text-xs text-slate-500">
              {portfolio.projections.coveragePercent.toFixed(0)}% analyzed
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 text-sm">Bull</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-medium">
                  $
                  {portfolio.projections.bull.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-emerald-400 text-sm ml-2">
                  (+{portfolio.projections.bullChange.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300 text-sm">Base</span>
              </div>
              <div className="text-right">
                <span className="text-blue-400 font-medium">
                  $
                  {portfolio.projections.base.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-blue-400 text-sm ml-2">
                  ({portfolio.projections.baseChange >= 0 ? '+' : ''}
                  {portfolio.projections.baseChange.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span className="text-slate-300 text-sm">Bear</span>
              </div>
              <div className="text-right">
                <span className="text-rose-400 font-medium">
                  $
                  {portfolio.projections.bear.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-rose-400 text-sm ml-2">
                  ({portfolio.projections.bearChange.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holdings Breakdown */}
      <div>
        <p className="text-slate-400 text-sm mb-2">
          Holdings ({portfolio.positions.length})
        </p>
        <div className="space-y-2">
          {portfolio.positions.slice(0, 5).map((pos) => (
            <div key={pos.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{pos.symbol}</span>
                <span className="text-slate-500 text-sm">
                  {pos.shares} shares
                </span>
              </div>
              <div className="text-right">
                <span className="text-white">
                  $
                  {pos.value.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-slate-500 text-sm ml-2">
                  {pos.weight.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
          {portfolio.positions.length > 5 && (
            <p className="text-slate-500 text-sm">
              +{portfolio.positions.length - 5} more
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function parsePriceTarget(target: string, currentPrice: number): number {
  if (!target) return currentPrice;

  if (target.startsWith('$')) {
    return parseFloat(target.replace('$', ''));
  }

  const percentMatch = target.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1]);
    return currentPrice * (1 + percent / 100);
  }

  const numericValue = parseFloat(target);
  if (!isNaN(numericValue)) {
    return numericValue;
  }

  return currentPrice;
}

export default PortfolioSummary;
