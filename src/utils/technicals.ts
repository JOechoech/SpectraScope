/**
 * Technical Indicators - Client-Side Calculations
 * All calculations performed from historical OHLCV data.
 */

// ═══════════════════════════════════════════════════════════════════════════
// RSI - Relative Strength Index
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate RSI (Relative Strength Index)
 * RSI < 30 = oversold (bullish), RSI > 70 = overbought (bearish)
 */
export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) {
    throw new Error(`Need at least ${period + 1} data points for RSI`);
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate smoothed averages for remaining data
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// ═══════════════════════════════════════════════════════════════════════════
// MACD - Moving Average Convergence Divergence
// ═══════════════════════════════════════════════════════════════════════════

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  macdLine: number[];
  signalLine: number[];
  histogramLine: number[];
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * MACD > 0 and rising = bullish, MACD < 0 and falling = bearish
 */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDResult {
  const ema12 = calculateEMAArray(closes, fastPeriod);
  const ema26 = calculateEMAArray(closes, slowPeriod);

  // MACD Line = EMA12 - EMA26
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i >= slowPeriod - 1) {
      macdLine.push(ema12[i] - ema26[i]);
    }
  }

  // Signal Line = 9-period EMA of MACD Line
  const signalLine = calculateEMAArray(macdLine, signalPeriod);

  // Histogram = MACD Line - Signal Line
  const histogramLine: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macdIndex = macdLine.length - signalLine.length + i;
    histogramLine.push(macdLine[macdIndex] - signalLine[i]);
  }

  return {
    macd: macdLine[macdLine.length - 1] || 0,
    signal: signalLine[signalLine.length - 1] || 0,
    histogram: histogramLine[histogramLine.length - 1] || 0,
    macdLine,
    signalLine,
    histogramLine,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Moving Averages (SMA & EMA)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) {
    throw new Error(`Need at least ${period} data points for SMA${period}`);
  }

  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

/**
 * Calculate SMA array for charting
 */
export function calculateSMAArray(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    result.push(slice.reduce((sum, val) => sum + val, 0) / period);
  }
  return result;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): number {
  const emaArray = calculateEMAArray(data, period);
  return emaArray[emaArray.length - 1] || 0;
}

/**
 * Calculate EMA array for charting
 */
export function calculateEMAArray(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const result: number[] = [];

  // First EMA is SMA
  let ema = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  result.push(ema);

  // Calculate remaining EMAs
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// Bollinger Bands
// ═══════════════════════════════════════════════════════════════════════════

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  width: number;
  percentB: number; // Position within bands (0-1)
}

/**
 * Calculate Bollinger Bands
 * Price near lower band = bullish, near upper = bearish
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): BollingerBandsResult {
  if (closes.length < period) {
    throw new Error(`Need at least ${period} data points for Bollinger Bands`);
  }

  const slice = closes.slice(-period);
  const middle = slice.reduce((sum, val) => sum + val, 0) / period;

  // Calculate standard deviation
  const squaredDiffs = slice.map((val) => Math.pow(val - middle, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + stdDevMultiplier * stdDev;
  const lower = middle - stdDevMultiplier * stdDev;
  const width = ((upper - lower) / middle) * 100;
  const currentPrice = closes[closes.length - 1];
  const percentB = (currentPrice - lower) / (upper - lower);

  return { upper, middle, lower, width, percentB };
}

// ═══════════════════════════════════════════════════════════════════════════
// Stochastic Oscillator
// ═══════════════════════════════════════════════════════════════════════════

export interface StochasticResult {
  k: number; // Fast stochastic
  d: number; // Slow stochastic (signal line)
}

/**
 * Calculate Stochastic Oscillator
 * K < 20 = oversold (bullish), K > 80 = overbought (bearish)
 */
export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod = 14,
  dPeriod = 3
): StochasticResult {
  if (closes.length < kPeriod) {
    throw new Error(`Need at least ${kPeriod} data points for Stochastic`);
  }

  const kValues: number[] = [];

  for (let i = kPeriod - 1; i < closes.length; i++) {
    const highSlice = highs.slice(i - kPeriod + 1, i + 1);
    const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...highSlice);
    const lowestLow = Math.min(...lowSlice);
    const close = closes[i];

    const k = highestHigh === lowestLow
      ? 50
      : ((close - lowestLow) / (highestHigh - lowestLow)) * 100;
    kValues.push(k);
  }

  // %D is SMA of %K
  const k = kValues[kValues.length - 1];
  const dSlice = kValues.slice(-dPeriod);
  const d = dSlice.reduce((sum, val) => sum + val, 0) / dPeriod;

  return { k, d };
}

// ═══════════════════════════════════════════════════════════════════════════
// Volume Analysis
// ═══════════════════════════════════════════════════════════════════════════

export interface VolumeAnalysis {
  current: number;
  average: number;
  ratio: number;
  signal: 'high' | 'normal' | 'low';
}

/**
 * Analyze volume relative to average
 * Volume > 150% avg = high, < 80% = low
 */
export function analyzeVolume(volumes: number[], period = 20): VolumeAnalysis {
  if (volumes.length < period) {
    throw new Error(`Need at least ${period} data points for volume analysis`);
  }

  const current = volumes[volumes.length - 1];
  const avgSlice = volumes.slice(-period - 1, -1);
  const average = avgSlice.reduce((sum, val) => sum + val, 0) / period;
  const ratio = current / average;

  let signal: 'high' | 'normal' | 'low';
  if (ratio > 1.5) {
    signal = 'high';
  } else if (ratio < 0.8) {
    signal = 'low';
  } else {
    signal = 'normal';
  }

  return { current, average, ratio, signal };
}

// ═══════════════════════════════════════════════════════════════════════════
// ATR - Average True Range (Volatility)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate ATR (Average True Range)
 * Used for volatility measurement
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): number {
  if (closes.length < period + 1) {
    throw new Error(`Need at least ${period + 1} data points for ATR`);
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }

  // Simple average for initial ATR
  let atr = trueRanges.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

  // Smoothed ATR for remaining periods
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }

  return atr;
}

// ═══════════════════════════════════════════════════════════════════════════
// OBV - On Balance Volume
// ═══════════════════════════════════════════════════════════════════════════

export interface OBVResult {
  current: number;
  trend: 'rising' | 'falling' | 'flat';
  values: number[];
}

/**
 * Calculate OBV (On Balance Volume)
 * Rising OBV = bullish, Falling = bearish
 */
export function calculateOBV(closes: number[], volumes: number[]): OBVResult {
  if (closes.length !== volumes.length) {
    throw new Error('Closes and volumes must have same length');
  }

  const obvValues: number[] = [volumes[0]];

  for (let i = 1; i < closes.length; i++) {
    const prevOBV = obvValues[i - 1];
    if (closes[i] > closes[i - 1]) {
      obvValues.push(prevOBV + volumes[i]);
    } else if (closes[i] < closes[i - 1]) {
      obvValues.push(prevOBV - volumes[i]);
    } else {
      obvValues.push(prevOBV);
    }
  }

  // Determine trend from last 5 periods
  const recentOBV = obvValues.slice(-5);
  const obvChange = recentOBV[recentOBV.length - 1] - recentOBV[0];
  const avgOBV = Math.abs(recentOBV.reduce((s, v) => s + v, 0) / 5);
  const changePercent = avgOBV > 0 ? (obvChange / avgOBV) * 100 : 0;

  let trend: 'rising' | 'falling' | 'flat';
  if (changePercent > 5) {
    trend = 'rising';
  } else if (changePercent < -5) {
    trend = 'falling';
  } else {
    trend = 'flat';
  }

  return {
    current: obvValues[obvValues.length - 1],
    trend,
    values: obvValues,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ADX - Average Directional Index
// ═══════════════════════════════════════════════════════════════════════════

export interface ADXResult {
  adx: number;
  plusDI: number;
  minusDI: number;
  trend: 'strong' | 'weak' | 'none';
  direction: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Calculate ADX (Average Directional Index)
 * ADX > 25 = strong trend, < 20 = weak/no trend
 */
export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): ADXResult {
  if (closes.length < period * 2) {
    throw new Error(`Need at least ${period * 2} data points for ADX`);
  }

  // Calculate +DM, -DM, TR
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ));
  }

  // Smooth the values
  const smoothedPlusDM = smoothArray(plusDM, period);
  const smoothedMinusDM = smoothArray(minusDM, period);
  const smoothedTR = smoothArray(tr, period);

  // Calculate +DI and -DI
  const plusDI = (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = (smoothedMinusDM / smoothedTR) * 100;

  // Calculate DX and ADX
  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
  const adx = dx; // Simplified - would need historical DX for true ADX

  let trend: 'strong' | 'weak' | 'none';
  if (adx > 25) {
    trend = 'strong';
  } else if (adx > 20) {
    trend = 'weak';
  } else {
    trend = 'none';
  }

  let direction: 'bullish' | 'bearish' | 'neutral';
  if (plusDI > minusDI && adx > 20) {
    direction = 'bullish';
  } else if (minusDI > plusDI && adx > 20) {
    direction = 'bearish';
  } else {
    direction = 'neutral';
  }

  return { adx, plusDI, minusDI, trend, direction };
}

// Helper function for smoothing
function smoothArray(data: number[], period: number): number {
  let smoothed = data.slice(0, period).reduce((sum, val) => sum + val, 0);
  for (let i = period; i < data.length; i++) {
    smoothed = smoothed - (smoothed / period) + data[i];
  }
  return smoothed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Price Position Analysis
// ═══════════════════════════════════════════════════════════════════════════

export interface PricePosition {
  aboveSMA20: boolean;
  aboveSMA50: boolean;
  aboveSMA200: boolean;
  aboveEMA12: boolean;
  aboveEMA26: boolean;
  goldenCross: boolean;  // SMA50 > SMA200
  deathCross: boolean;   // SMA50 < SMA200
}

/**
 * Analyze price position relative to key moving averages
 */
export function analyzePricePosition(closes: number[]): PricePosition {
  const currentPrice = closes[closes.length - 1];

  const sma20 = closes.length >= 20 ? calculateSMA(closes, 20) : currentPrice;
  const sma50 = closes.length >= 50 ? calculateSMA(closes, 50) : currentPrice;
  const sma200 = closes.length >= 200 ? calculateSMA(closes, 200) : currentPrice;
  const ema12 = closes.length >= 12 ? calculateEMA(closes, 12) : currentPrice;
  const ema26 = closes.length >= 26 ? calculateEMA(closes, 26) : currentPrice;

  return {
    aboveSMA20: currentPrice > sma20,
    aboveSMA50: currentPrice > sma50,
    aboveSMA200: currentPrice > sma200,
    aboveEMA12: currentPrice > ema12,
    aboveEMA26: currentPrice > ema26,
    goldenCross: sma50 > sma200,
    deathCross: sma50 < sma200,
  };
}
