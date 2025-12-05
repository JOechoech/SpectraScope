/**
 * Alpha Vantage API Service
 * 
 * Documentation: https://www.alphavantage.co/documentation/
 * 
 * Rate Limits (Free Tier):
 * - 5 API calls per minute
 * - 500 API calls per day
 */

import type { 
  StockQuote, 
  HistoricalDataPoint, 
  TechnicalIndicators,
  AlphaVantageQuote,
  AlphaVantageTimeSeries 
} from '@/types';

const BASE_URL = 'https://www.alphavantage.co/query';

// ═══════════════════════════════════════════════════════════════════════════
// QUOTE DATA
// ═══════════════════════════════════════════════════════════════════════════

export async function getQuote(symbol: string, apiKey: string): Promise<StockQuote> {
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Check for API errors
  if (data['Error Message']) {
    throw new Error(data['Error Message']);
  }
  
  if (data['Note']) {
    throw new Error('API rate limit exceeded. Please wait and try again.');
  }
  
  const quote: AlphaVantageQuote = data['Global Quote'];
  
  if (!quote || !quote['05. price']) {
    throw new Error(`No data found for symbol: ${symbol}`);
  }
  
  return {
    symbol: quote['01. symbol'],
    open: parseFloat(quote['02. open']),
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low']),
    price: parseFloat(quote['05. price']),
    volume: parseInt(quote['06. volume'], 10),
    latestTradingDay: quote['07. latest trading day'],
    previousClose: parseFloat(quote['08. previous close']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORICAL DATA
// ═══════════════════════════════════════════════════════════════════════════

export async function getDailyData(
  symbol: string,
  apiKey: string,
  outputSize: 'compact' | 'full' = 'compact'
): Promise<HistoricalDataPoint[]> {
  const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message']) {
    throw new Error(data['Error Message']);
  }
  
  if (data['Note']) {
    throw new Error('API rate limit exceeded');
  }
  
  const timeSeries: AlphaVantageTimeSeries = data['Time Series (Daily)'];
  
  if (!timeSeries) {
    throw new Error(`No historical data found for symbol: ${symbol}`);
  }
  
  return Object.entries(timeSeries)
    .map(([date, values]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getIntradayData(
  symbol: string,
  apiKey: string,
  interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
): Promise<HistoricalDataPoint[]> {
  const url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message'] || data['Note']) {
    throw new Error(data['Error Message'] || 'API rate limit exceeded');
  }
  
  const timeSeries = data[`Time Series (${interval})`];
  
  if (!timeSeries) {
    throw new Error(`No intraday data found for symbol: ${symbol}`);
  }
  
  return Object.entries(timeSeries)
    .map(([date, values]: [string, any]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICAL INDICATORS
// ═══════════════════════════════════════════════════════════════════════════

export async function getRSI(
  symbol: string,
  apiKey: string,
  timePeriod: number = 14
): Promise<number> {
  const url = `${BASE_URL}?function=RSI&symbol=${symbol}&interval=daily&time_period=${timePeriod}&series_type=close&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message'] || data['Note']) {
    throw new Error(data['Error Message'] || 'API rate limit exceeded');
  }
  
  const technicalData = data['Technical Analysis: RSI'];
  
  if (!technicalData) {
    throw new Error(`No RSI data found for symbol: ${symbol}`);
  }
  
  // Get the most recent value
  const latestDate = Object.keys(technicalData)[0];
  return parseFloat(technicalData[latestDate].RSI);
}

export async function getMACD(
  symbol: string,
  apiKey: string
): Promise<{ macd: number; signal: number; histogram: number }> {
  const url = `${BASE_URL}?function=MACD&symbol=${symbol}&interval=daily&series_type=close&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message'] || data['Note']) {
    throw new Error(data['Error Message'] || 'API rate limit exceeded');
  }
  
  const technicalData = data['Technical Analysis: MACD'];
  
  if (!technicalData) {
    throw new Error(`No MACD data found for symbol: ${symbol}`);
  }
  
  const latestDate = Object.keys(technicalData)[0];
  const latest = technicalData[latestDate];
  
  return {
    macd: parseFloat(latest.MACD),
    signal: parseFloat(latest.MACD_Signal),
    histogram: parseFloat(latest.MACD_Hist),
  };
}

export async function getSMA(
  symbol: string,
  apiKey: string,
  timePeriod: number = 20
): Promise<number> {
  const url = `${BASE_URL}?function=SMA&symbol=${symbol}&interval=daily&time_period=${timePeriod}&series_type=close&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message'] || data['Note']) {
    throw new Error(data['Error Message'] || 'API rate limit exceeded');
  }
  
  const technicalData = data['Technical Analysis: SMA'];
  
  if (!technicalData) {
    throw new Error(`No SMA data found for symbol: ${symbol}`);
  }
  
  const latestDate = Object.keys(technicalData)[0];
  return parseFloat(technicalData[latestDate].SMA);
}

export async function getEMA(
  symbol: string,
  apiKey: string,
  timePeriod: number = 12
): Promise<number> {
  const url = `${BASE_URL}?function=EMA&symbol=${symbol}&interval=daily&time_period=${timePeriod}&series_type=close&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message'] || data['Note']) {
    throw new Error(data['Error Message'] || 'API rate limit exceeded');
  }
  
  const technicalData = data['Technical Analysis: EMA'];
  
  if (!technicalData) {
    throw new Error(`No EMA data found for symbol: ${symbol}`);
  }
  
  const latestDate = Object.keys(technicalData)[0];
  return parseFloat(technicalData[latestDate].EMA);
}

export async function getBollingerBands(
  symbol: string,
  apiKey: string
): Promise<{ upper: number; middle: number; lower: number }> {
  const url = `${BASE_URL}?function=BBANDS&symbol=${symbol}&interval=daily&time_period=20&series_type=close&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message'] || data['Note']) {
    throw new Error(data['Error Message'] || 'API rate limit exceeded');
  }
  
  const technicalData = data['Technical Analysis: BBANDS'];
  
  if (!technicalData) {
    throw new Error(`No Bollinger Bands data found for symbol: ${symbol}`);
  }
  
  const latestDate = Object.keys(technicalData)[0];
  const latest = technicalData[latestDate];
  
  return {
    upper: parseFloat(latest['Real Upper Band']),
    middle: parseFloat(latest['Real Middle Band']),
    lower: parseFloat(latest['Real Lower Band']),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPANY INFO
// ═══════════════════════════════════════════════════════════════════════════

export async function getCompanyOverview(
  symbol: string,
  apiKey: string
): Promise<{
  name: string;
  description: string;
  exchange: string;
  sector: string;
  industry: string;
  marketCap: string;
  peRatio: number;
  dividendYield: number;
  high52Week: number;
  low52Week: number;
  beta: number;
}> {
  const url = `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message'] || Object.keys(data).length === 0) {
    throw new Error(`No company data found for symbol: ${symbol}`);
  }
  
  return {
    name: data.Name,
    description: data.Description,
    exchange: data.Exchange,
    sector: data.Sector,
    industry: data.Industry,
    marketCap: data.MarketCapitalization,
    peRatio: parseFloat(data.PERatio) || 0,
    dividendYield: parseFloat(data.DividendYield) || 0,
    high52Week: parseFloat(data['52WeekHigh']),
    low52Week: parseFloat(data['52WeekLow']),
    beta: parseFloat(data.Beta) || 1,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SYMBOL SEARCH
// ═══════════════════════════════════════════════════════════════════════════

export async function searchSymbols(
  keywords: string,
  apiKey: string
): Promise<Array<{
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}>> {
  const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Error Message']) {
    throw new Error(data['Error Message']);
  }
  
  const matches = data.bestMatches || [];
  
  return matches.map((match: any) => ({
    symbol: match['1. symbol'],
    name: match['2. name'],
    type: match['3. type'],
    region: match['4. region'],
    currency: match['8. currency'],
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA (for development without API key)
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_PRICES: Record<string, number> = {
  AAPL: 182.52,
  MSFT: 425.30,
  GOOGL: 175.20,
  NVDA: 892.40,
  TSLA: 248.50,
  AMZN: 178.90,
  META: 505.75,
  BRK: 412.30,
  JPM: 198.45,
  V: 275.60,
};

export function getMockQuote(symbol: string): StockQuote {
  const basePrice = MOCK_PRICES[symbol] || 100 + Math.random() * 200;
  const change = (Math.random() - 0.5) * 10;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol,
    open: basePrice - Math.random() * 2,
    high: basePrice * 1.02,
    low: basePrice * 0.98,
    price: basePrice,
    volume: Math.floor(Math.random() * 50000000),
    latestTradingDay: new Date().toISOString().split('T')[0],
    previousClose: basePrice - change,
    change,
    changePercent,
  };
}

export function getMockDailyData(
  symbol: string,
  days: number = 100
): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  let price = MOCK_PRICES[symbol] || 150;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const dailyChange = (Math.random() - 0.5) * 5;
    price = Math.max(50, price + dailyChange);

    data.push({
      date: date.toISOString().split('T')[0],
      open: price - Math.random() * 2,
      high: price + Math.random() * 3,
      low: price - Math.random() * 3,
      close: price,
      volume: Math.floor(Math.random() * 50000000),
    });
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// AGGREGATED TECHNICALS (for Quick Scan)
// ═══════════════════════════════════════════════════════════════════════════

export async function getAllTechnicals(
  symbol: string,
  apiKey: string,
  currentPrice: number
): Promise<TechnicalIndicators> {
  // Note: This makes multiple API calls. In production, consider caching
  // or using a paid plan with higher rate limits.
  
  const [rsi, macd, sma20, sma50] = await Promise.all([
    getRSI(symbol, apiKey),
    getMACD(symbol, apiKey),
    getSMA(symbol, apiKey, 20),
    getSMA(symbol, apiKey, 50),
  ]);
  
  const rsiSignal = rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral';
  const macdTrend = macd.histogram > 0 
    ? (macd.histogram > macd.signal ? 'bullish' : 'neutral')
    : 'bearish';
  
  return {
    rsi,
    rsiSignal,
    macd: macd.macd,
    macdSignal: macd.signal,
    macdHistogram: macd.histogram,
    macdTrend,
    sma20,
    sma20Above: currentPrice > sma20,
    sma50,
    sma50Above: currentPrice > sma50,
  };
}
