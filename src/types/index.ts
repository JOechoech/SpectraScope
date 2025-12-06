// ═══════════════════════════════════════════════════════════════════════════
// STOCK TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: string;
  high52w?: number;
  low52w?: number;
  sparkline?: number[];
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  open: number;
  high: number;
  low: number;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICAL INDICATORS
// ═══════════════════════════════════════════════════════════════════════════

export interface TechnicalIndicators {
  rsi: number;
  rsiSignal: 'oversold' | 'neutral' | 'overbought';
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  macdTrend: 'bullish' | 'bearish' | 'neutral';
  sma20: number;
  sma20Above: boolean;
  sma50: number;
  sma50Above: boolean;
  sma200?: number;
  sma200Above?: boolean;
  ema12?: number;
  ema26?: number;
  bollingerUpper?: number;
  bollingerLower?: number;
  atr?: number;
}

export type VolumeLevel = 'high' | 'normal' | 'low';
export type VolatilityLevel = 'low' | 'moderate' | 'high';
export type TrendDirection = 'uptrend' | 'downtrend' | 'sideways';

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface QuickScanResult {
  timestamp: string;
  type: 'quick';
  symbol: string;
  technicals: {
    rsi: number;
    rsiSignal: 'oversold' | 'neutral' | 'overbought';
    macd: number;
    macdSignal: 'bullish' | 'bearish' | 'neutral';
    sma20: 'above' | 'below';
    sma50: 'above' | 'below';
    sma200?: 'above' | 'below';
    volume: VolumeLevel;
    volatility: VolatilityLevel;
    trend: TrendDirection;
  };
  summary: string;
  signals: {
    bullish: string[];
    bearish: string[];
  };
  score: number; // -100 to +100
}

export interface Scenario {
  probability: number;
  priceTarget: string;
  timeframe: string;
  title: string;
  summary: string;
  catalysts: string[];
  risks: string[];
}

export interface SourceAssessment {
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number; // 1-10
  reason: string;
}

export interface DeepDiveResult {
  timestamp: string;
  type: 'deep';
  symbol: string;
  scenarios: {
    bull: Scenario;
    bear: Scenario;
    base: Scenario;
  };
  sentiment: {
    news: 'positive' | 'neutral' | 'negative';
    social: 'bullish' | 'mixed' | 'bearish';
    options: 'call-heavy' | 'balanced' | 'put-heavy';
  };
  confidence: number;
  reasoning: string;
  bottomLine?: string; // Claude's 5-10 sentence investor summary
  overallSentiment?: 'bullish' | 'bearish' | 'neutral';
  overallScore?: number; // 1-10 overall rating
  sourceAssessments?: SourceAssessment[];
  tokenUsage?: {
    input: number;
    output: number;
    cost: number;
  };
}

export type AnalysisResult = QuickScanResult | DeepDiveResult;

export type AnalysisMode = 'quick' | 'deep';

// ═══════════════════════════════════════════════════════════════════════════
// NEWS & SENTIMENT
// ═══════════════════════════════════════════════════════════════════════════

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevanceScore: number;
  symbols: string[];
}

export interface SocialSentiment {
  platform: 'twitter' | 'reddit' | 'stocktwits';
  mentions: number;
  sentiment: number; // -1 to +1
  trending: boolean;
  topPosts?: {
    id: string;
    text: string;
    engagement: number;
  }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// API & SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export type ApiProvider = 'alphavantage' | 'polygon' | 'finnhub';
export type AiProvider = 'anthropic' | 'openai';

export interface ApiKeys {
  alphavantage?: string;
  polygon?: string;
  finnhub?: string;
  anthropic?: string;
  openai?: string;
  twitter?: string;
  grok?: string;        // xAI API for social sentiment
  gemini?: string;      // Google Gemini for web research
  perplexity?: string;  // Perplexity API for web research
  newsapi?: string;     // NewsAPI for news headlines
  mediastack?: string;  // MediaStack for additional news coverage
}

export interface UserSettings {
  darkMode: boolean;
  defaultAnalysisMode: AnalysisMode;
  defaultAiProvider: AiProvider;
  notifications: boolean;
  hapticFeedback: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// WATCHLIST
// ═══════════════════════════════════════════════════════════════════════════

export interface WatchlistItem extends Stock {
  addedAt: string;
  notes?: string;
  alerts?: PriceAlert[];
  lastAnalysis?: {
    type: AnalysisMode;
    timestamp: string;
    score?: number;
  };
}

export interface PriceAlert {
  id: string;
  type: 'above' | 'below' | 'change';
  value: number;
  active: boolean;
  createdAt: string;
  triggeredAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════════════════

export type ViewName = 'watchlist' | 'detail' | 'settings' | 'search' | 'portfolio';

export interface AppState {
  currentView: ViewName;
  selectedStock: Stock | null;
  isLoading: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    cached: boolean;
    rateLimitRemaining?: number;
  };
}

export interface AlphaVantageQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

export interface AlphaVantageTimeSeries {
  [date: string]: {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// INTELLIGENCE TYPES (Re-export)
// ═══════════════════════════════════════════════════════════════════════════

export * from './intelligence';
