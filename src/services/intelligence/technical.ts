/**
 * Technical Intelligence Service
 *
 * Computes technical analysis indicators client-side.
 * Always available - no API key required.
 */

import type { HistoricalDataPoint, TechnicalIndicators } from '@/types';
import type { TechnicalReport, TechnicalReportData } from '@/types/intelligence';
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateBollingerBands,
  calculateATR,
  analyzeVolume,
  analyzePricePosition,
  type PricePosition,
} from '@/utils/technicals';
import {
  getRSISignal,
  getMACDSignal,
  getSMASignal,
  getBollingerSignal,
  getVolumeSignal,
  calculateAggregateScore,
  type SignalResult,
} from '@/utils/signals';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GATHER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gather technical intelligence from price data
 *
 * @param symbol - Stock symbol
 * @param priceData - Historical price data (most recent first)
 * @param currentPrice - Current price
 * @returns Technical intelligence report
 */
export async function gatherTechnicalIntelligence(
  symbol: string,
  priceData: HistoricalDataPoint[],
  currentPrice: number
): Promise<TechnicalReport | null> {
  try {
    if (!priceData || priceData.length < 20) {
      console.warn(`[Technical] Insufficient data for ${symbol}`);
      return null;
    }

    // Extract price arrays (ensure chronological order for calculations)
    const chronological = [...priceData].reverse();
    const closes = chronological.map((d) => d.close);
    const highs = chronological.map((d) => d.high);
    const lows = chronological.map((d) => d.low);
    const volumes = chronological.map((d) => d.volume);

    // Calculate indicators
    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const bollinger = calculateBollingerBands(closes);
    const volumeAnalysis = analyzeVolume(volumes);
    const atr = calculateATR(highs, lows, closes);
    const pricePosition = analyzePricePosition(closes);

    // Build indicators object
    const indicators: TechnicalIndicators = {
      rsi,
      rsiSignal: rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral',
      macd: macd.macd,
      macdSignal: macd.signal,
      macdHistogram: macd.histogram,
      macdTrend:
        macd.histogram > 0
          ? macd.histogram > macd.signal
            ? 'bullish'
            : 'neutral'
          : 'bearish',
      sma20,
      sma20Above: currentPrice > sma20,
      sma50,
      sma50Above: currentPrice > sma50,
      bollingerUpper: bollinger.upper,
      bollingerLower: bollinger.lower,
      atr,
    };

    // Generate signals
    const signals: SignalResult[] = [
      getRSISignal(rsi),
      getMACDSignal(macd.histogram, macd.histogram - macd.signal),
      getSMASignal(currentPrice, sma20, 20),
      getSMASignal(currentPrice, sma50, 50),
      getBollingerSignal(
        currentPrice,
        bollinger.upper,
        bollinger.middle,
        bollinger.lower
      ),
      getVolumeSignal(volumeAnalysis.ratio),
    ];

    // Calculate aggregate score
    const aggregateScore = calculateAggregateScore(signals);

    // Determine trend direction from price position and moving averages
    const trendDirection = determineTrendDirection(pricePosition, currentPrice, sma20, sma50);

    // Check if near support/resistance using Bollinger Bands
    const nearSupport = currentPrice <= bollinger.lower * 1.02; // Within 2% of lower band
    const nearResistance = currentPrice >= bollinger.upper * 0.98; // Within 2% of upper band

    // Build report data
    const data: TechnicalReportData = {
      indicators,
      signals,
      aggregateScore,
      pricePosition: {
        nearSupport,
        nearResistance,
        trendDirection,
      },
    };

    // Generate summary
    const summary = generateTechnicalSummary(symbol, data);

    return {
      source: 'technical-analysis',
      timestamp: new Date().toISOString(),
      confidence: calculateTechnicalConfidence(data),
      data,
      summary,
    };
  } catch (error) {
    console.error(`[Technical] Error gathering intelligence for ${symbol}:`, error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate human-readable summary of technical analysis
 */
function generateTechnicalSummary(
  symbol: string,
  data: TechnicalReportData
): string {
  const { indicators, aggregateScore, pricePosition } = data;
  const parts: string[] = [];

  // Overall sentiment
  parts.push(
    `${symbol} shows ${aggregateScore.sentiment} signals (${aggregateScore.label}).`
  );

  // RSI
  if (indicators.rsiSignal === 'oversold') {
    parts.push(`RSI at ${indicators.rsi.toFixed(1)} indicates oversold conditions.`);
  } else if (indicators.rsiSignal === 'overbought') {
    parts.push(`RSI at ${indicators.rsi.toFixed(1)} suggests overbought conditions.`);
  }

  // Trend
  parts.push(
    `Price is in a ${pricePosition.trendDirection} with ${
      indicators.sma20Above ? 'bullish' : 'bearish'
    } momentum.`
  );

  // MACD
  if (indicators.macdTrend === 'bullish') {
    parts.push('MACD shows bullish momentum.');
  } else if (indicators.macdTrend === 'bearish') {
    parts.push('MACD indicates bearish pressure.');
  }

  return parts.join(' ');
}

/**
 * Calculate confidence score for technical analysis
 */
function calculateTechnicalConfidence(data: TechnicalReportData): number {
  const { signals, aggregateScore } = data;

  // Base confidence on signal agreement
  const totalSignals = signals.length;
  const agreeingSignals = Math.max(
    aggregateScore.bullishCount,
    aggregateScore.bearishCount
  );

  // Higher agreement = higher confidence
  const agreementRatio = agreeingSignals / totalSignals;

  // Scale to 60-95 range (technical analysis alone shouldn't claim 100%)
  const confidence = 60 + agreementRatio * 35;

  return Math.round(confidence);
}

/**
 * Determine trend direction from price position and moving averages
 */
function determineTrendDirection(
  pricePosition: PricePosition,
  _currentPrice: number,
  _sma20: number,
  _sma50: number
): 'uptrend' | 'downtrend' | 'sideways' {
  // Check for strong trend signals
  const aboveBothSMAs = pricePosition.aboveSMA20 && pricePosition.aboveSMA50;
  const belowBothSMAs = !pricePosition.aboveSMA20 && !pricePosition.aboveSMA50;
  const goldenCross = pricePosition.goldenCross;
  const deathCross = pricePosition.deathCross;

  // Strong uptrend: price above both SMAs AND SMA50 > SMA200 (golden cross)
  if (aboveBothSMAs && goldenCross) {
    return 'uptrend';
  }

  // Strong downtrend: price below both SMAs AND SMA50 < SMA200 (death cross)
  if (belowBothSMAs && deathCross) {
    return 'downtrend';
  }

  // Moderate uptrend: price above both SMAs
  if (aboveBothSMAs) {
    return 'uptrend';
  }

  // Moderate downtrend: price below both SMAs
  if (belowBothSMAs) {
    return 'downtrend';
  }

  // Mixed signals = sideways
  return 'sideways';
}
