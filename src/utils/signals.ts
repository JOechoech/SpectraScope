/**
 * Signal Mapping - Values to Bull/Bear/Neutral + Glow Effect
 * Maps raw indicator values to our 3-color signal schema
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type Signal = 'bullish' | 'neutral' | 'bearish';
export type GlowEffect = 'glow-bullish' | 'glow-bearish' | null;

export interface SignalResult {
  signal: Signal;
  label: string;
  description: string;
  value?: number | string;
}

export interface AggregateScore {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  total: number;
  percentage: number; // 0-100 (bullish percentage)
  sentiment: Signal;
  glowEffect: GlowEffect;
  label: string; // "8/10 Bullish"
}

// ═══════════════════════════════════════════════════════════════════════════
// Signal Colors (for reference)
// ═══════════════════════════════════════════════════════════════════════════

export const signalColors = {
  bullish: {
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
  },
  neutral: {
    text: 'text-amber-500',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
  },
  bearish: {
    text: 'text-rose-500',
    bg: 'bg-rose-500/20',
    border: 'border-rose-500/30',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// RSI Signal
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get RSI signal
 * RSI < 30 = oversold (bullish), RSI > 70 = overbought (bearish)
 */
export function getRSISignal(rsi: number): SignalResult {
  if (rsi < 30) {
    return {
      signal: 'bullish',
      label: 'Oversold',
      description: `RSI at ${rsi.toFixed(1)} indicates oversold conditions`,
      value: rsi,
    };
  }
  if (rsi > 70) {
    return {
      signal: 'bearish',
      label: 'Overbought',
      description: `RSI at ${rsi.toFixed(1)} indicates overbought conditions`,
      value: rsi,
    };
  }
  return {
    signal: 'neutral',
    label: 'Neutral',
    description: `RSI at ${rsi.toFixed(1)} is in neutral territory`,
    value: rsi,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MACD Signal
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get MACD signal based on histogram direction
 * Rising histogram = bullish, Falling = bearish
 */
export function getMACDSignal(
  histogram: number,
  prevHistogram: number
): SignalResult {
  const isRising = histogram > prevHistogram;
  const isPositive = histogram > 0;

  if (isPositive && isRising) {
    return {
      signal: 'bullish',
      label: 'Bullish',
      description: 'MACD histogram positive and rising',
      value: histogram,
    };
  }
  if (!isPositive && !isRising) {
    return {
      signal: 'bearish',
      label: 'Bearish',
      description: 'MACD histogram negative and falling',
      value: histogram,
    };
  }
  return {
    signal: 'neutral',
    label: 'Neutral',
    description: 'MACD showing mixed signals',
    value: histogram,
  };
}

/**
 * Get MACD crossover signal
 */
export function getMACDCrossoverSignal(
  macd: number,
  signal: number,
  prevMacd: number,
  prevSignal: number
): SignalResult {
  const currentAbove = macd > signal;
  const prevAbove = prevMacd > prevSignal;

  if (currentAbove && !prevAbove) {
    return {
      signal: 'bullish',
      label: 'Bullish Cross',
      description: 'MACD crossed above signal line',
    };
  }
  if (!currentAbove && prevAbove) {
    return {
      signal: 'bearish',
      label: 'Bearish Cross',
      description: 'MACD crossed below signal line',
    };
  }
  if (currentAbove) {
    return {
      signal: 'bullish',
      label: 'Above Signal',
      description: 'MACD above signal line',
    };
  }
  return {
    signal: 'bearish',
    label: 'Below Signal',
    description: 'MACD below signal line',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Moving Average Signals
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get SMA signal based on price position
 * Price above SMA = bullish, below = bearish
 */
export function getSMASignal(
  price: number,
  sma: number,
  period: number
): SignalResult {
  const percentDiff = ((price - sma) / sma) * 100;

  if (price > sma) {
    return {
      signal: 'bullish',
      label: `Above SMA${period}`,
      description: `Price ${percentDiff.toFixed(1)}% above SMA${period}`,
      value: `+${percentDiff.toFixed(1)}%`,
    };
  }
  if (price < sma) {
    return {
      signal: 'bearish',
      label: `Below SMA${period}`,
      description: `Price ${Math.abs(percentDiff).toFixed(1)}% below SMA${period}`,
      value: `${percentDiff.toFixed(1)}%`,
    };
  }
  return {
    signal: 'neutral',
    label: `At SMA${period}`,
    description: `Price at SMA${period}`,
    value: '0%',
  };
}

/**
 * Get Golden/Death Cross signal
 */
export function getCrossSignal(
  sma50: number,
  sma200: number
): SignalResult {
  if (sma50 > sma200) {
    return {
      signal: 'bullish',
      label: 'Golden Cross',
      description: 'SMA50 above SMA200 (bullish structure)',
    };
  }
  if (sma50 < sma200) {
    return {
      signal: 'bearish',
      label: 'Death Cross',
      description: 'SMA50 below SMA200 (bearish structure)',
    };
  }
  return {
    signal: 'neutral',
    label: 'Converging',
    description: 'SMA50 and SMA200 converging',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Bollinger Bands Signal
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Bollinger Bands signal
 * Near lower band = bullish (oversold), near upper = bearish (overbought)
 */
export function getBollingerSignal(
  price: number,
  upper: number,
  _middle: number,
  lower: number
): SignalResult {
  const percentB = (price - lower) / (upper - lower);

  if (price <= lower || percentB < 0.1) {
    return {
      signal: 'bullish',
      label: 'Lower Band',
      description: 'Price at/below lower Bollinger Band',
      value: `${(percentB * 100).toFixed(0)}%`,
    };
  }
  if (price >= upper || percentB > 0.9) {
    return {
      signal: 'bearish',
      label: 'Upper Band',
      description: 'Price at/above upper Bollinger Band',
      value: `${(percentB * 100).toFixed(0)}%`,
    };
  }
  return {
    signal: 'neutral',
    label: 'Middle',
    description: 'Price within Bollinger Bands',
    value: `${(percentB * 100).toFixed(0)}%`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Stochastic Signal
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Stochastic signal
 * K < 20 = oversold (bullish), K > 80 = overbought (bearish)
 */
export function getStochasticSignal(k: number, _d: number): SignalResult {
  if (k < 20) {
    return {
      signal: 'bullish',
      label: 'Oversold',
      description: `Stochastic %K at ${k.toFixed(1)} (oversold)`,
      value: k,
    };
  }
  if (k > 80) {
    return {
      signal: 'bearish',
      label: 'Overbought',
      description: `Stochastic %K at ${k.toFixed(1)} (overbought)`,
      value: k,
    };
  }
  return {
    signal: 'neutral',
    label: 'Neutral',
    description: `Stochastic %K at ${k.toFixed(1)}`,
    value: k,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Volume Signal
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Volume signal
 * Volume > 150% avg = high, < 80% = low
 */
export function getVolumeSignal(ratio: number): SignalResult {
  const percent = (ratio * 100).toFixed(0);

  if (ratio > 1.5) {
    return {
      signal: 'bullish',
      label: 'High Volume',
      description: `Volume at ${percent}% of average (high interest)`,
      value: `${percent}%`,
    };
  }
  if (ratio < 0.8) {
    return {
      signal: 'bearish',
      label: 'Low Volume',
      description: `Volume at ${percent}% of average (low interest)`,
      value: `${percent}%`,
    };
  }
  return {
    signal: 'neutral',
    label: 'Normal',
    description: `Volume at ${percent}% of average`,
    value: `${percent}%`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// OBV Signal
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get OBV (On Balance Volume) signal
 */
export function getOBVSignal(trend: 'rising' | 'falling' | 'flat'): SignalResult {
  if (trend === 'rising') {
    return {
      signal: 'bullish',
      label: 'Rising',
      description: 'OBV trending up (accumulation)',
    };
  }
  if (trend === 'falling') {
    return {
      signal: 'bearish',
      label: 'Falling',
      description: 'OBV trending down (distribution)',
    };
  }
  return {
    signal: 'neutral',
    label: 'Flat',
    description: 'OBV flat (no clear accumulation/distribution)',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Options Signals
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Put/Call Ratio signal
 * < 0.7 = bullish, > 1.0 = bearish
 */
export function getPutCallSignal(ratio: number): SignalResult {
  if (ratio < 0.7) {
    return {
      signal: 'bullish',
      label: 'Call Heavy',
      description: `P/C ratio at ${ratio.toFixed(2)} (bullish sentiment)`,
      value: ratio,
    };
  }
  if (ratio > 1.0) {
    return {
      signal: 'bearish',
      label: 'Put Heavy',
      description: `P/C ratio at ${ratio.toFixed(2)} (bearish sentiment)`,
      value: ratio,
    };
  }
  return {
    signal: 'neutral',
    label: 'Balanced',
    description: `P/C ratio at ${ratio.toFixed(2)} (neutral)`,
    value: ratio,
  };
}

/**
 * Get IV Rank signal
 * < 30% = low/cheap (bullish for buying), > 70% = high/expensive (bearish)
 */
export function getIVRankSignal(ivRank: number): SignalResult {
  if (ivRank < 30) {
    return {
      signal: 'bullish',
      label: 'Low IV',
      description: `IV Rank at ${ivRank.toFixed(0)}% (options cheap)`,
      value: `${ivRank.toFixed(0)}%`,
    };
  }
  if (ivRank > 70) {
    return {
      signal: 'bearish',
      label: 'High IV',
      description: `IV Rank at ${ivRank.toFixed(0)}% (options expensive)`,
      value: `${ivRank.toFixed(0)}%`,
    };
  }
  return {
    signal: 'neutral',
    label: 'Normal IV',
    description: `IV Rank at ${ivRank.toFixed(0)}%`,
    value: `${ivRank.toFixed(0)}%`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Aggregate Score Calculation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate aggregate score from multiple signals
 * Returns overall sentiment and glow effect
 */
export function calculateAggregateScore(signals: SignalResult[]): AggregateScore {
  const bullishCount = signals.filter((s) => s.signal === 'bullish').length;
  const bearishCount = signals.filter((s) => s.signal === 'bearish').length;
  const neutralCount = signals.filter((s) => s.signal === 'neutral').length;
  const total = signals.length;

  // Calculate bullish percentage
  const percentage = total > 0 ? (bullishCount / total) * 100 : 50;

  // Determine overall sentiment
  let sentiment: Signal;
  if (bullishCount > bearishCount && bullishCount > neutralCount) {
    sentiment = 'bullish';
  } else if (bearishCount > bullishCount && bearishCount > neutralCount) {
    sentiment = 'bearish';
  } else {
    sentiment = 'neutral';
  }

  // Determine glow effect
  // ≥80% bullish = golden glow, ≤20% bullish (≥80% bearish) = red glow
  let glowEffect: GlowEffect = null;
  if (percentage >= 80) {
    glowEffect = 'glow-bullish';
  } else if (percentage <= 20) {
    glowEffect = 'glow-bearish';
  }

  // Generate label
  const label = `${bullishCount}/${total} Bullish`;

  return {
    bullishCount,
    bearishCount,
    neutralCount,
    total,
    percentage,
    sentiment,
    glowEffect,
    label,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get CSS classes for a signal
 */
export function getSignalClasses(signal: Signal): {
  text: string;
  bg: string;
  border: string;
} {
  return signalColors[signal];
}

/**
 * Get icon name for signal (for use with Lucide icons)
 */
export function getSignalIcon(signal: Signal): string {
  switch (signal) {
    case 'bullish':
      return 'TrendingUp';
    case 'bearish':
      return 'TrendingDown';
    default:
      return 'Minus';
  }
}
