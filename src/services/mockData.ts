import type { Stock, HistoricalDataPoint } from '@/types';

/**
 * Mock Data Service - Simulates API responses with realistic delay
 * Used for development and demo purposes
 */

// Default watchlist stocks
export const defaultWatchlist: Stock[] = [
  { symbol: 'TSLA', name: 'Tesla Inc', price: 248.50, change: 12.35, changePercent: 5.23, sparkline: [220, 225, 218, 230, 235, 228, 242, 248] },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 875.28, change: -18.42, changePercent: -2.06, sparkline: [920, 915, 900, 890, 885, 870, 880, 875] },
  { symbol: 'AAPL', name: 'Apple Inc', price: 189.84, change: 2.15, changePercent: 1.15, sparkline: [185, 186, 188, 187, 189, 188, 190, 189] },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: 378.91, change: 4.67, changePercent: 1.25, sparkline: [370, 372, 375, 373, 376, 378, 377, 378] },
  { symbol: 'META', name: 'Meta Platforms', price: 485.22, change: -8.33, changePercent: -1.69, sparkline: [500, 498, 492, 488, 490, 485, 487, 485] },
  { symbol: 'AMZN', name: 'Amazon.com', price: 178.25, change: 3.42, changePercent: 1.96, sparkline: [172, 174, 175, 176, 177, 175, 178, 178] },
];

// Generate chart data
export function generateChartData(basePrice: number, days = 30): (HistoricalDataPoint & { price: number })[] {
  const data: (HistoricalDataPoint & { price: number })[] = [];
  let price = basePrice * 0.9;

  for (let i = 0; i < days; i++) {
    const volatility = (Math.random() - 0.5) * 8;
    const open = price;
    const close = price + volatility;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    const volume = Math.floor(Math.random() * 50000000) + 10000000;

    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      open: +open.toFixed(2),
      close: +close.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      volume,
      price: +close.toFixed(2),
    });
    price = close;
  }
  return data;
}

// Quick Scan Analysis (Technical indicators only)
interface QuickScanMockResult {
  timestamp: string;
  type: 'quick';
  technicals: {
    rsi: number;
    macd: number;
    sma20: 'above' | 'below';
    sma50: 'above' | 'below';
    volume: 'high' | 'normal' | 'low';
    volatility: 'low' | 'moderate' | 'high';
  };
  summary: string;
}

export async function mockQuickScan(symbol: string): Promise<QuickScanMockResult> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const rsi = Math.floor(Math.random() * 40) + 30;
  const sma20 = Math.random() > 0.5 ? 'above' : 'below';
  const sma50 = Math.random() > 0.5 ? 'above' : 'below';
  const trend = ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)];

  return {
    timestamp: new Date().toISOString(),
    type: 'quick',
    technicals: {
      rsi,
      macd: +(Math.random() - 0.5).toFixed(2) * 2,
      sma20,
      sma50,
      volume: Math.random() > 0.5 ? 'high' : 'normal',
      volatility: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'moderate' | 'high',
    },
    summary: `Technical analysis shows ${symbol} is trading ${sma20} key moving averages with ${trend} momentum indicators.`,
  };
}

// Deep Dive Analysis (Full AI-powered scenarios)
interface DeepDiveMockResult {
  timestamp: string;
  type: 'deep';
  scenarios: {
    bull: ScenarioMock;
    bear: ScenarioMock;
    base: ScenarioMock;
  };
  sentiment: {
    news: 'positive' | 'neutral' | 'negative';
    social: 'bullish' | 'mixed' | 'bearish';
    options: 'call-heavy' | 'balanced' | 'put-heavy';
  };
}

interface ScenarioMock {
  probability: number;
  priceTarget: string;
  timeframe: string;
  title: string;
  summary: string;
  catalysts: string[];
}

export async function mockDeepDive(symbol: string): Promise<DeepDiveMockResult> {
  await new Promise(resolve => setTimeout(resolve, 3500));

  const bullProb = Math.floor(Math.random() * 25) + 20;
  const bearProb = Math.floor(Math.random() * 25) + 15;
  const baseProb = 100 - bullProb - bearProb;

  return {
    timestamp: new Date().toISOString(),
    type: 'deep',
    scenarios: {
      bull: {
        probability: bullProb,
        priceTarget: '+18-25%',
        timeframe: '6-12 months',
        title: 'Optimistic Scenario',
        summary: `Strong institutional buying pressure combined with positive earnings momentum could drive ${symbol} to new highs. Key catalysts include expanding margins, market share gains, and favorable macro conditions.`,
        catalysts: ['Earnings beat expectations', 'New product launches', 'Market expansion', 'Favorable regulations'],
      },
      bear: {
        probability: bearProb,
        priceTarget: '-15-22%',
        timeframe: '3-6 months',
        title: 'Pessimistic Scenario',
        summary: `Downside risks include deteriorating fundamentals, increased competition, and broader market correction. Watch for insider selling and declining institutional interest.`,
        catalysts: ['Revenue miss', 'Margin compression', 'Competitive pressure', 'Macro headwinds'],
      },
      base: {
        probability: baseProb,
        priceTarget: '+2-8%',
        timeframe: '12 months',
        title: 'Base Case',
        summary: `Most likely scenario sees ${symbol} trading in a range with gradual appreciation aligned with sector performance. Balanced risk/reward profile suitable for long-term holders.`,
        catalysts: ['Steady growth', 'Market consensus', 'Sector rotation', 'Dividend stability'],
      },
    },
    sentiment: {
      news: Math.random() > 0.5 ? 'positive' : 'neutral',
      social: Math.random() > 0.5 ? 'bullish' : 'mixed',
      options: Math.random() > 0.5 ? 'call-heavy' : 'balanced',
    },
  };
}

export type { QuickScanMockResult, DeepDiveMockResult, ScenarioMock };
