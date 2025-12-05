/**
 * Technical Indicator Information
 *
 * Educational content explaining what each indicator means
 * and how to interpret its signals.
 */

export interface IndicatorInfo {
  name: string;
  fullName: string;
  description: string;
  interpretation: {
    bullish: string;
    bearish: string;
    neutral: string;
  };
  range?: string;
}

export const INDICATOR_INFO: Record<string, IndicatorInfo> = {
  RSI: {
    name: 'RSI',
    fullName: 'Relative Strength Index',
    description:
      'Measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions.',
    interpretation: {
      bullish:
        'RSI below 30 suggests oversold conditions - potential buying opportunity',
      bearish:
        'RSI above 70 suggests overbought conditions - potential selling pressure',
      neutral: 'RSI between 30-70 indicates normal trading conditions',
    },
    range: '0-100',
  },
  MACD: {
    name: 'MACD',
    fullName: 'Moving Average Convergence Divergence',
    description:
      'A trend-following momentum indicator showing the relationship between two moving averages.',
    interpretation: {
      bullish:
        'MACD crossing above signal line or positive histogram suggests upward momentum',
      bearish:
        'MACD crossing below signal line or negative histogram suggests downward momentum',
      neutral: 'MACD near zero line indicates consolidation',
    },
  },
  'SMA 20': {
    name: 'SMA 20',
    fullName: '20-Day Simple Moving Average',
    description:
      'Average closing price over the last 20 days. Used to identify short-term trends.',
    interpretation: {
      bullish: 'Price above SMA 20 indicates short-term uptrend',
      bearish: 'Price below SMA 20 indicates short-term downtrend',
      neutral: 'Price crossing SMA 20 may signal trend change',
    },
  },
  'SMA 50': {
    name: 'SMA 50',
    fullName: '50-Day Simple Moving Average',
    description:
      'Average closing price over the last 50 days. Key indicator for medium-term trends.',
    interpretation: {
      bullish: 'Price above SMA 50 indicates medium-term uptrend',
      bearish: 'Price below SMA 50 indicates medium-term downtrend',
      neutral: 'SMA 50 is a key support/resistance level',
    },
  },
  'SMA 200': {
    name: 'SMA 200',
    fullName: '200-Day Simple Moving Average',
    description:
      'The most watched long-term trend indicator. Defines bull vs bear markets.',
    interpretation: {
      bullish: 'Price above SMA 200 = Bull Market territory',
      bearish: 'Price below SMA 200 = Bear Market territory',
      neutral: 'Price near SMA 200 is a critical decision point',
    },
  },
  Bollinger: {
    name: 'Bollinger',
    fullName: 'Bollinger Bands',
    description:
      'Volatility bands placed above and below a moving average. Width indicates volatility.',
    interpretation: {
      bullish: 'Price near lower band suggests oversold - potential bounce',
      bearish: 'Price near upper band suggests overbought - potential pullback',
      neutral: 'Price in middle of bands indicates normal volatility',
    },
  },
  Volume: {
    name: 'Volume',
    fullName: 'Trading Volume',
    description:
      'Number of shares traded. High volume confirms price movements.',
    interpretation: {
      bullish: 'Rising price + high volume = strong bullish confirmation',
      bearish: 'Falling price + high volume = strong bearish confirmation',
      neutral: 'Low volume suggests weak conviction in price move',
    },
  },
  ADX: {
    name: 'ADX',
    fullName: 'Average Directional Index',
    description:
      'Measures trend strength regardless of direction. Does not indicate bullish/bearish.',
    interpretation: {
      bullish: 'ADX > 25 with +DI > -DI indicates strong uptrend',
      bearish: 'ADX > 25 with -DI > +DI indicates strong downtrend',
      neutral: 'ADX < 20 indicates weak or no trend (ranging market)',
    },
    range: '0-100',
  },
  Stochastic: {
    name: 'Stochastic',
    fullName: 'Stochastic Oscillator',
    description:
      'Compares closing price to price range over a period. Shows momentum.',
    interpretation: {
      bullish: 'Stochastic below 20 = oversold, potential reversal up',
      bearish: 'Stochastic above 80 = overbought, potential reversal down',
      neutral: 'Between 20-80 indicates normal momentum',
    },
    range: '0-100',
  },
};

/**
 * Get indicator info by name (supports partial matching)
 */
export function getIndicatorInfo(name: string): IndicatorInfo | null {
  // Try exact match first
  if (INDICATOR_INFO[name]) return INDICATOR_INFO[name];

  // Try partial match (e.g., "RSI (14)" -> "RSI")
  const baseName = name.split(' ')[0].split('(')[0].trim();
  return INDICATOR_INFO[baseName] || null;
}

export default {
  INDICATOR_INFO,
  getIndicatorInfo,
};
