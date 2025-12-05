# CLAUDE.md - SpectraScope Development Guide

> **Projektname:** SpectraScope  
> **Version:** 0.1.0 (MVP)  
> **Typ:** Cross-Platform Investment Analysis PWA  
> **Zielplattformen:** Web, iOS (PWA), macOS (PWA)

---

## 🎯 Projekt-Vision

SpectraScope ist eine Premium-Investment-Analyse-App, die Finanzdaten aggregiert und mittels AI drei narrative Szenarien (Bull, Bear, Base Case) generiert. Das Alleinstellungsmerkmal ist die **Kostenkontrolle** – teure AI-Analysen werden nur manuell vom User ausgelöst.

### Design-Philosophie
- **Apple/iOS-Ästhetik**: High-End Dark Mode (OLED-optimiert)
- **Glassmorphism**: Backdrop-blur Effekte für Overlays
- **Inspiration**: Apple Stocks App trifft Yahoo Finance, aber cleaner

---

## 📁 Projektstruktur

```
spectrascope/
├── CLAUDE.md                    # Diese Datei
├── README.md                    # Projekt-Dokumentation
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── index.html
├── .env.example                 # Beispiel für Umgebungsvariablen
├── .env.local                   # Lokale API Keys (NICHT committen!)
│
├── public/
│   ├── manifest.json            # PWA Manifest
│   ├── sw.js                    # Service Worker
│   └── icons/                   # App Icons (192x192, 512x512)
│
├── src/
│   ├── main.tsx                 # Entry Point
│   ├── App.tsx                  # Root Component mit Navigation
│   ├── index.css                # Tailwind imports + custom styles
│   │
│   ├── components/
│   │   ├── ui/                  # Basis UI-Komponenten
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Toast.tsx
│   │   │
│   │   ├── charts/              # Chart-Komponenten
│   │   │   ├── Sparkline.tsx
│   │   │   ├── PriceChart.tsx
│   │   │   ├── CandlestickChart.tsx
│   │   │   └── VolumeChart.tsx
│   │   │
│   │   ├── analysis/            # SpectraScope Engine UI
│   │   │   ├── AnalysisPanel.tsx
│   │   │   ├── ScenarioCard.tsx
│   │   │   ├── TechnicalSummary.tsx
│   │   │   ├── SentimentIndicators.tsx
│   │   │   └── AnalysisHistory.tsx
│   │   │
│   │   └── layout/              # Layout-Komponenten
│   │       ├── Header.tsx
│   │       ├── Navigation.tsx
│   │       └── StatusBar.tsx
│   │
│   ├── views/                   # Haupt-Views
│   │   ├── WatchlistView.tsx
│   │   ├── DetailView.tsx
│   │   ├── SettingsView.tsx
│   │   └── SearchView.tsx
│   │
│   ├── services/                # API & Business Logic
│   │   ├── api/
│   │   │   ├── index.ts         # API Client Setup
│   │   │   ├── financial.ts     # Finanzdaten APIs
│   │   │   ├── news.ts          # News APIs
│   │   │   └── social.ts        # Social Sentiment APIs
│   │   │
│   │   ├── ai/
│   │   │   ├── index.ts         # AI Service Factory
│   │   │   ├── anthropic.ts     # Claude API Integration
│   │   │   ├── openai.ts        # OpenAI Integration
│   │   │   └── prompts.ts       # Prompt Templates
│   │   │
│   │   └── analysis/
│   │       ├── quickScan.ts     # Technical Analysis
│   │       ├── deepDive.ts      # Full AI Analysis
│   │       └── scenarios.ts     # Scenario Generation
│   │
│   ├── stores/                  # State Management (Zustand)
│   │   ├── useWatchlist.ts
│   │   ├── useAnalysis.ts
│   │   ├── useSettings.ts
│   │   └── useApiKeys.ts
│   │
│   ├── hooks/                   # Custom React Hooks
│   │   ├── useStockData.ts
│   │   ├── useRealTimePrice.ts
│   │   ├── useAnalysisHistory.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── types/                   # TypeScript Definitionen
│   │   ├── stock.ts
│   │   ├── analysis.ts
│   │   ├── scenario.ts
│   │   └── api.ts
│   │
│   ├── utils/                   # Hilfsfunktionen
│   │   ├── formatters.ts        # Zahlen, Währungen, Daten
│   │   ├── validators.ts        # API Key Validierung
│   │   ├── calculations.ts      # Technische Indikatoren
│   │   └── storage.ts           # Sichere LocalStorage Wrapper
│   │
│   └── constants/               # Konstanten
│       ├── endpoints.ts         # API Endpoints
│       ├── indicators.ts        # Technische Indikatoren Config
│       └── theme.ts             # Design Tokens
│
└── tests/                       # Tests
    ├── components/
    ├── services/
    └── utils/
```

---

## 🔧 Tech Stack

### Core
- **Framework:** React 18+ mit TypeScript
- **Build Tool:** Vite 5+
- **Styling:** Tailwind CSS 3.4+
- **Icons:** Lucide React
- **Charts:** Recharts

### State Management
- **Global State:** Zustand (leichtgewichtig, TypeScript-first)
- **Server State:** TanStack Query (React Query) für API Caching

### APIs & Integrationen
| Dienst | Zweck | Priorität |
|--------|-------|-----------|
| **Alpha Vantage** | Aktienkurse, Historische Daten | P0 |
| **Polygon.io** | Real-time Quotes, Options | P1 |
| **Finnhub** | News, Sentiment | P1 |
| **Anthropic Claude** | AI Scenario Generation | P0 |
| **OpenAI GPT-4** | Alternative AI Engine | P1 |
| **Twitter/X API** | Social Sentiment | P2 |
| **Reddit API** | Retail Sentiment | P2 |

---

## 🚀 Entwicklungs-Phasen

### Phase 1: Foundation (Woche 1-2)
- [ ] Projekt-Setup mit Vite + TypeScript
- [ ] Tailwind Config mit Design Tokens
- [ ] Basis UI-Komponenten erstellen
- [ ] Zustand Stores implementieren
- [ ] LocalStorage Security Layer
- [ ] PWA Manifest + Service Worker

### Phase 2: Data Layer (Woche 2-3)
- [ ] Financial API Integration (Alpha Vantage)
- [ ] Real-time WebSocket für Kurse
- [ ] Chart-Komponenten mit echten Daten
- [ ] Caching-Strategie mit React Query
- [ ] Offline-Fähigkeit für Watchlist

### Phase 3: AI Engine (Woche 3-4)
- [ ] Anthropic Claude API Integration
- [ ] Prompt Engineering für Szenarien
- [ ] Quick Scan: Technische Analyse
- [ ] Deep Dive: Full AI Analysis
- [ ] Token-Tracking für Kostenkontrolle
- [ ] Analysis History speichern

### Phase 4: Polish & Deploy (Woche 4-5)
- [ ] Error Handling & Loading States
- [ ] Animationen verfeinern
- [ ] Performance-Optimierung
- [ ] Testing (Unit + Integration)
- [ ] Deployment (Vercel/Netlify)
- [ ] App Store Screenshots

---

## 📝 API Integrationen - Details

### 1. Alpha Vantage (Finanzdaten)

```typescript
// src/services/api/financial.ts

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  latestTradingDay: string;
}

interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getQuote(symbol: string, apiKey: string): Promise<StockQuote> {
  const response = await fetch(
    `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
  );
  const data = await response.json();
  
  const quote = data['Global Quote'];
  return {
    symbol: quote['01. symbol'],
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    volume: parseInt(quote['06. volume']),
    latestTradingDay: quote['07. latest trading day']
  };
}

export async function getDaily(
  symbol: string, 
  apiKey: string,
  outputSize: 'compact' | 'full' = 'compact'
): Promise<HistoricalData[]> {
  const response = await fetch(
    `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${apiKey}`
  );
  const data = await response.json();
  
  const timeSeries = data['Time Series (Daily)'];
  return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
    date,
    open: parseFloat(values['1. open']),
    high: parseFloat(values['2. high']),
    low: parseFloat(values['3. low']),
    close: parseFloat(values['4. close']),
    volume: parseInt(values['5. volume'])
  }));
}

// Technische Indikatoren
export async function getRSI(symbol: string, apiKey: string): Promise<number> {
  const response = await fetch(
    `${ALPHA_VANTAGE_BASE}?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${apiKey}`
  );
  const data = await response.json();
  const latest = Object.values(data['Technical Analysis: RSI'])[0] as any;
  return parseFloat(latest.RSI);
}

export async function getMACD(symbol: string, apiKey: string): Promise<{
  macd: number;
  signal: number;
  histogram: number;
}> {
  const response = await fetch(
    `${ALPHA_VANTAGE_BASE}?function=MACD&symbol=${symbol}&interval=daily&series_type=close&apikey=${apiKey}`
  );
  const data = await response.json();
  const latest = Object.values(data['Technical Analysis: MACD'])[0] as any;
  return {
    macd: parseFloat(latest.MACD),
    signal: parseFloat(latest.MACD_Signal),
    histogram: parseFloat(latest.MACD_Hist)
  };
}
```

### 2. Anthropic Claude API (AI Engine)

```typescript
// src/services/ai/anthropic.ts

import Anthropic from '@anthropic-ai/sdk';

interface ScenarioOutput {
  bull: Scenario;
  bear: Scenario;
  base: Scenario;
  confidence: number;
  reasoning: string;
}

interface Scenario {
  probability: number;
  priceTarget: string;
  timeframe: string;
  title: string;
  summary: string;
  catalysts: string[];
  risks: string[];
}

export async function generateScenarios(
  symbol: string,
  stockData: StockData,
  newsData: NewsItem[],
  technicals: TechnicalIndicators,
  apiKey: string
): Promise<ScenarioOutput> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  
  const systemPrompt = `Du bist ein erfahrener Finanzanalyst mit Expertise in fundamentaler und technischer Analyse. 
Deine Aufgabe ist es, drei realistische Szenarien für eine Aktie zu erstellen:

1. **Bull Case (Optimistisch)**: Das beste realistische Szenario
2. **Bear Case (Pessimistisch)**: Das schlechteste realistische Szenario  
3. **Base Case (Basis)**: Das wahrscheinlichste Szenario

Für jedes Szenario liefere:
- Wahrscheinlichkeit (in %)
- Preisziel (als Prozent-Range, z.B. "+15-25%")
- Zeitrahmen
- Kurze Zusammenfassung (2-3 Sätze)
- 3-4 Schlüssel-Katalysatoren
- 2-3 Hauptrisiken

Antworte NUR mit validem JSON im folgenden Format:
{
  "bull": { "probability": number, "priceTarget": string, "timeframe": string, "title": string, "summary": string, "catalysts": string[], "risks": string[] },
  "bear": { ... },
  "base": { ... },
  "confidence": number,
  "reasoning": string
}`;

  const userPrompt = `Analysiere ${symbol} und erstelle die drei Szenarien.

**Aktuelle Daten:**
- Kurs: $${stockData.price}
- Tagesveränderung: ${stockData.changePercent}%
- 52-Wochen-Hoch: $${stockData.high52w}
- 52-Wochen-Tief: $${stockData.low52w}
- Marktkapitalisierung: ${stockData.marketCap}

**Technische Indikatoren:**
- RSI (14): ${technicals.rsi}
- MACD: ${technicals.macd}
- SMA 20: ${technicals.sma20Above ? 'Kurs darüber' : 'Kurs darunter'}
- SMA 50: ${technicals.sma50Above ? 'Kurs darüber' : 'Kurs darunter'}

**Aktuelle News:**
${newsData.slice(0, 5).map(n => `- ${n.headline} (${n.sentiment})`).join('\n')}

Erstelle jetzt die drei Szenarien als JSON.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      { role: 'user', content: userPrompt }
    ],
    system: systemPrompt
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  // Parse JSON aus der Antwort
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from response');
  }

  return JSON.parse(jsonMatch[0]) as ScenarioOutput;
}

// Token-Tracking für Kostenkontrolle
export function estimateTokenCost(inputTokens: number, outputTokens: number): number {
  // Claude Sonnet Preise (Stand: 2025)
  const INPUT_COST_PER_1K = 0.003;  // $3 per 1M tokens
  const OUTPUT_COST_PER_1K = 0.015; // $15 per 1M tokens
  
  return (inputTokens / 1000 * INPUT_COST_PER_1K) + 
         (outputTokens / 1000 * OUTPUT_COST_PER_1K);
}
```

### 3. Quick Scan (Technische Analyse)

```typescript
// src/services/analysis/quickScan.ts

interface QuickScanResult {
  timestamp: string;
  type: 'quick';
  technicals: {
    rsi: number;
    rsiSignal: 'oversold' | 'neutral' | 'overbought';
    macd: number;
    macdSignal: 'bullish' | 'bearish' | 'neutral';
    sma20: 'above' | 'below';
    sma50: 'above' | 'below';
    sma200: 'above' | 'below';
    volume: 'high' | 'normal' | 'low';
    volatility: 'low' | 'moderate' | 'high';
    trend: 'uptrend' | 'downtrend' | 'sideways';
  };
  summary: string;
  signals: {
    bullish: string[];
    bearish: string[];
  };
  score: number; // -100 bis +100
}

export async function runQuickScan(
  symbol: string,
  apiKey: string
): Promise<QuickScanResult> {
  // Parallele API-Calls für Performance
  const [rsi, macd, sma, dailyData] = await Promise.all([
    getRSI(symbol, apiKey),
    getMACD(symbol, apiKey),
    getSMA(symbol, apiKey),
    getDaily(symbol, apiKey, 'compact')
  ]);

  // RSI Interpretation
  const rsiSignal = rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral';
  
  // MACD Interpretation
  const macdSignal = macd.histogram > 0 
    ? (macd.histogram > macd.signal ? 'bullish' : 'neutral')
    : 'bearish';

  // Volumen-Analyse (Vergleich mit 20-Tage-Durchschnitt)
  const recentVolumes = dailyData.slice(0, 20).map(d => d.volume);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / 20;
  const currentVolume = dailyData[0].volume;
  const volumeRatio = currentVolume / avgVolume;
  const volume = volumeRatio > 1.5 ? 'high' : volumeRatio < 0.5 ? 'low' : 'normal';

  // Volatilität (ATR-basiert)
  const atr = calculateATR(dailyData.slice(0, 14));
  const atrPercent = (atr / dailyData[0].close) * 100;
  const volatility = atrPercent > 3 ? 'high' : atrPercent < 1.5 ? 'low' : 'moderate';

  // Trend-Bestimmung
  const prices = dailyData.slice(0, 20).map(d => d.close);
  const trend = determineTrend(prices);

  // Scoring
  const { score, bullishSignals, bearishSignals } = calculateScore({
    rsi, rsiSignal, macdSignal, sma, volume, trend
  });

  // Summary generieren
  const summary = generateQuickSummary(symbol, {
    rsiSignal, macdSignal, trend, score
  });

  return {
    timestamp: new Date().toISOString(),
    type: 'quick',
    technicals: {
      rsi,
      rsiSignal,
      macd: macd.macd,
      macdSignal,
      sma20: sma.sma20Above ? 'above' : 'below',
      sma50: sma.sma50Above ? 'above' : 'below',
      sma200: sma.sma200Above ? 'above' : 'below',
      volume,
      volatility,
      trend
    },
    summary,
    signals: {
      bullish: bullishSignals,
      bearish: bearishSignals
    },
    score
  };
}

function calculateATR(data: HistoricalData[]): number {
  let atrSum = 0;
  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    atrSum += tr;
  }
  return atrSum / (data.length - 1);
}

function determineTrend(prices: number[]): 'uptrend' | 'downtrend' | 'sideways' {
  const first = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const last = prices.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const change = ((last - first) / first) * 100;
  
  if (change > 3) return 'uptrend';
  if (change < -3) return 'downtrend';
  return 'sideways';
}
```

---

## 📊 Technical Analysis Module

### Datenquellen-Strategie (Hybrid)

SpectraScope nutzt einen hybriden Ansatz:
- **Free Tier:** Funktioniert ohne API-Keys (mit Einschränkungen)
- **Premium:** User trägt eigene API-Keys ein → Mehr Features

| Tier | Quelle | Zweck |
|------|--------|-------|
| Free (Default) | Alpha Vantage Free | Historische Kurse (25 calls/Tag) |
| Free (Options) | Yahoo Finance | Basic Options (instabil) |
| Premium | Polygon.io | Full Data + Greeks + Real-time |

### Signal-Mapping (Bull/Bear/Neutral)

Alle Indikatoren werden auf unser 3-Farben-Schema gemappt:
- 🟢 **Bullish** (`text-emerald-500`, `bg-emerald-500/20`)
- 🟡 **Neutral** (`text-amber-500`, `bg-amber-500/20`)
- 🔴 **Bearish** (`text-rose-500`, `bg-rose-500/20`)

### ✨ Signal Glow Effect

Aktien mit besonders starken Signalen erhalten einen animierten Glow-Effekt:

| Score | Effekt | CSS Class |
|-------|--------|-----------|
| ≥ 80% Bullish | Golden Pulse | `glow-bullish` |
| 40-79% | Kein Effekt | - |
| ≤ 20% Bearish | Red Warning | `glow-bearish` |

```css
/* In index.css */
.glow-bullish {
  animation: pulse-gold 2s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
}

@keyframes pulse-gold {
  0%, 100% {
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.3);
    border-color: rgba(251, 191, 36, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(251, 191, 36, 0.6);
    border-color: rgba(251, 191, 36, 0.8);
  }
}

.glow-bearish {
  animation: pulse-red 2s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(244, 63, 94, 0.3);
}

@keyframes pulse-red {
  0%, 100% {
    box-shadow: 0 0 15px rgba(244, 63, 94, 0.2);
    border-color: rgba(244, 63, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 25px rgba(244, 63, 94, 0.4);
    border-color: rgba(244, 63, 94, 0.6);
  }
}
```

### Technische Indikatoren (Client-Side Berechnung)

| Indikator | Bullish | Neutral | Bearish | Berechnung |
|-----------|---------|---------|---------|------------|
| RSI(14) | < 30 (oversold) | 30-70 | > 70 (overbought) | Client |
| MACD | Bullish Cross | Flat | Bearish Cross | Client |
| MACD Histogram | Rising | Flat | Falling | Client |
| SMA 20 | Price Above | At | Price Below | Client |
| SMA 50/200 | Golden Cross | - | Death Cross | Client |
| EMA 12/26 | 12 > 26 | Equal | 12 < 26 | Client |
| Bollinger Bands | Near Lower | Middle | Near Upper | Client |
| Bollinger Width | Expanding | Normal | Squeezing | Client |
| ADX | > 25 + Trend Up | < 20 | > 25 + Trend Down | Client |
| Stochastic | < 20 | 20-80 | > 80 | Client |
| Volume | > 150% avg | 80-150% | < 80% | Client |
| OBV | Rising | Flat | Falling | Client |

### Options-Metriken

| Metrik | Bullish | Neutral | Bearish | Quelle |
|--------|---------|---------|---------|--------|
| Put/Call Ratio | < 0.7 | 0.7-1.0 | > 1.0 | Yahoo/Polygon |
| Open Interest Δ | Calls ↑↑ | Flat | Puts ↑↑ | Yahoo/Polygon |
| IV Rank | < 30% (cheap) | 30-70% | > 70% (expensive) | Yahoo/Polygon |
| IV Percentile | < 30% | 30-70% | > 70% | Yahoo/Polygon |
| Max Pain vs Price | Price < Max Pain | At Max Pain | Price > Max Pain | Polygon only |
| Delta (Aggregate) | > 0.3 | -0.3 to 0.3 | < -0.3 | Polygon only |
| Gamma Exposure | Positive | Neutral | Negative | Polygon only |

### Aggregate Score

```typescript
interface AggregateScore {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  total: number;
  percentage: number;        // 0-100
  sentiment: 'bullish' | 'neutral' | 'bearish';
  glowEffect: 'glow-bullish' | 'glow-bearish' | null;
  label: string;             // "8/10 Bullish"
}
```

### Komponenten-Architektur

```
src/components/analysis/
├── TechnicalSignalsTable.tsx   # Haupttabelle mit allen Signalen
├── SignalBadge.tsx             # 🟢🟡🔴 Badge Component
├── IndicatorRow.tsx            # Einzelne Indikator-Zeile
├── OptionsMetrics.tsx          # Options-spezifische Metriken
└── AggregateScore.tsx          # Zusammenfassungs-Score

src/utils/
├── technicals.ts               # Alle Indikator-Berechnungen
├── signals.ts                  # Wert → Signal Mapping
└── optionsAnalysis.ts          # Options-Berechnungen

src/services/api/
├── alphavantage.ts             # Bestehend, erweitern
├── yahoo.ts                    # NEU: Yahoo Finance (Options)
└── polygon.ts                  # NEU: Premium API
```

---

## 🤖 AI Analysis Architecture

### Analysis Flow

```
User opens ticker
        │
        ▼
┌─────────────────────────────┐
│ AUTO: Technical Analysis    │  ← Free, instant, client-side
│ RSI, MACD, SMA, etc.        │
│ Aggregate Score shown       │
└─────────────────────────────┘
        │
        ▼ (User clicks "Scope")
┌─────────────────────────────┐
│ PAID: AI Deep Analysis      │  ← Claude API call
│ 3 Scenarios generated       │
│ Cost shown before/after     │
└─────────────────────────────┘
```

### Cost Model

| Analysis Type | Cost | Time | Trigger |
|--------------|------|------|---------|
| Technical Analysis | Free | ~50ms | Automatic on load |
| Quick Scan | ~$0.005 | ~2s | Manual ("Scope") |
| Deep Dive | ~$0.02-0.04 | ~4s | Manual ("Scope") |

### Prompt Strategy

**Language:** English (better training data, more accurate financial terminology)

**System Prompt:** Defines role, output format, constraints
**User Prompt:** Dynamic data injection (price, technicals, news, options)

### Response Format

```typescript
interface AIAnalysisResponse {
  bull: Scenario;
  bear: Scenario;
  base: Scenario;
  confidence: number;      // 0-100
  reasoning: string;       // Methodology explanation
}

interface Scenario {
  probability: number;     // Must sum to ~100% across all three
  priceTarget: string;     // e.g., "+15% to +25%"
  timeframe: string;       // e.g., "6-12 months"
  title: string;           // Short, punchy
  summary: string;         // 3-4 sentences
  catalysts: string[];     // 3-4 key catalysts
  risks: string[];         // 2-3 main risks
}
```

### Data Storage

Analysis history stored in Zustand + localStorage:
- Max 10 analyses per ticker
- Auto-expire after 30 days
- Includes: input data, result, token usage, cost

### Token Usage Tracking

```typescript
interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cost: number;            // Calculated from model pricing
}

// Claude Sonnet pricing (as of 2025)
const PRICING = {
  input: 0.003,            // $3 per 1M tokens
  output: 0.015,           // $15 per 1M tokens
};
```

### UI Components

| Component | Purpose |
|-----------|---------|
| `ScopeButton.tsx` | Main CTA, shows cost estimate |
| `AnalysisHistory.tsx` | Past analyses list |
| `ScenarioCard.tsx` | Individual scenario display |
| `CostDisplay.tsx` | Token usage + cost breakdown |

---

## 🤖 Multi-AI Architecture

### Intelligence Sources

SpectraScope uses a "Master AI" architecture where Claude synthesizes intelligence from multiple specialized sources.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    Grok     │  │ Perplexity  │  │  Finnhub    │  │  Technical  │
│ (X/Twitter) │  │ (Research)  │  │   (News)    │  │  (Client)   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                                │
                                ▼
                   ┌─────────────────────┐
                   │   Claude Master     │
                   │   (Synthesizer)     │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Final Analysis     │
                   │  (3 Scenarios)      │
                   └─────────────────────┘
```

| Source | Purpose | API | Status |
|--------|---------|-----|--------|
| **Claude** | Master Synthesizer | Anthropic | ✅ Required |
| **Technical** | Indicators, Signals | Client-side | ✅ Always |
| **Finnhub** | News Headlines | Finnhub | 🟡 Free Tier |
| **Grok** | X/Twitter Sentiment | xAI | 🔮 Optional |
| **Perplexity** | Web Research | Perplexity | 🔮 Optional |
| **Polygon** | Options Flow | Polygon.io | 🔮 Premium |

### Data Flow

1. **Gather Phase**: Each enabled source fetches its specialty data
2. **Normalize Phase**: All data converted to standard `IntelligenceReport` format
3. **Synthesize Phase**: Claude receives all reports, generates scenarios
4. **Present Phase**: User sees unified analysis with source attribution

### Intelligence Report Interface

```typescript
interface IntelligenceReport {
  source: IntelligenceSource;
  timestamp: string;
  confidence: number;     // 0-100
  data: unknown;          // Source-specific data
  summary: string;        // Human-readable summary
}

type IntelligenceSource =
  | 'technical-analysis'  // Client-side computed
  | 'news-sentiment'      // Finnhub
  | 'social-sentiment'    // Grok (X/Twitter)
  | 'web-research'        // Perplexity
  | 'options-flow';       // Polygon
```

### Graceful Degradation

If optional sources unavailable:
- Analysis proceeds with available data
- UI shows which sources contributed
- Confidence score adjusts accordingly
- Quality indicator reflects data completeness

### Source Weighting

Claude weighs sources based on reliability:
- **Technical Analysis**: Reliable for timing signals
- **News Sentiment**: Reliable for catalysts & events
- **Social Sentiment**: Gauge retail interest (can be noisy)
- **Web Research**: Context and fundamentals
- **Options Flow**: Smart money positioning

---

## 🔐 Sicherheit & API Key Management

### Sichere LocalStorage Wrapper

```typescript
// src/utils/storage.ts

const ENCRYPTION_KEY = 'spectrascope_v1'; // In Produktion: User-spezifisch

export const SecureStorage = {
  setApiKey(provider: string, key: string): void {
    // Einfache Obfuskation (für echte Sicherheit: Web Crypto API)
    const encoded = btoa(key);
    localStorage.setItem(`ss_key_${provider}`, encoded);
  },

  getApiKey(provider: string): string | null {
    const encoded = localStorage.getItem(`ss_key_${provider}`);
    if (!encoded) return null;
    try {
      return atob(encoded);
    } catch {
      return null;
    }
  },

  removeApiKey(provider: string): void {
    localStorage.removeItem(`ss_key_${provider}`);
  },

  validateApiKey(provider: string, key: string): boolean {
    const patterns: Record<string, RegExp> = {
      openai: /^sk-[a-zA-Z0-9]{48,}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9-]{90,}$/,
      alphavantage: /^[A-Z0-9]{16}$/,
      polygon: /^[a-zA-Z0-9_]{32}$/
    };
    
    return patterns[provider]?.test(key) ?? false;
  }
};
```

---

## 🎨 Design Tokens

```typescript
// src/constants/theme.ts

export const theme = {
  colors: {
    // Backgrounds
    bg: {
      primary: '#000000',      // OLED Black
      secondary: '#0f172a',    // slate-900
      tertiary: '#1e293b',     // slate-800
      card: 'rgba(15, 23, 42, 0.5)', // Glassmorphism
    },
    
    // Text
    text: {
      primary: '#f1f5f9',      // slate-100
      secondary: '#94a3b8',    // slate-400
      muted: '#64748b',        // slate-500
    },
    
    // Accents
    accent: {
      bull: '#10b981',         // emerald-500
      bear: '#f43f5e',         // rose-500
      neutral: '#3b82f6',      // blue-500
      action: '#6366f1',       // indigo-500
    },
    
    // Borders
    border: {
      default: 'rgba(51, 65, 85, 0.5)', // slate-700/50
      focus: '#3b82f6',
    }
  },
  
  // Glassmorphism
  glass: {
    background: 'rgba(15, 23, 42, 0.5)',
    blur: '12px',
    border: '1px solid rgba(51, 65, 85, 0.5)',
  },
  
  // Shadows
  shadows: {
    glow: {
      bull: '0 0 20px rgba(16, 185, 129, 0.3)',
      bear: '0 0 20px rgba(244, 63, 94, 0.3)',
      neutral: '0 0 20px rgba(59, 130, 246, 0.3)',
    }
  },
  
  // Spacing (8px base)
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },
  
  // Border Radius
  radius: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',
  }
};
```

---

## 📱 PWA Konfiguration

```json
// public/manifest.json
{
  "name": "SpectraScope",
  "short_name": "SpectraScope",
  "description": "AI-Powered Investment Analysis",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["finance", "productivity"],
  "screenshots": [
    {
      "src": "/screenshots/watchlist.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "label": "Watchlist View"
    },
    {
      "src": "/screenshots/analysis.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "label": "AI Analysis"
    }
  ]
}
```

---

## 🧪 Testing Strategie

### Unit Tests (Vitest)

```typescript
// tests/services/quickScan.test.ts

import { describe, it, expect, vi } from 'vitest';
import { runQuickScan } from '@/services/analysis/quickScan';

describe('Quick Scan Analysis', () => {
  it('should return oversold signal when RSI < 30', async () => {
    vi.mock('@/services/api/financial', () => ({
      getRSI: () => Promise.resolve(25),
      getMACD: () => Promise.resolve({ macd: 0.5, signal: 0.3, histogram: 0.2 }),
      getSMA: () => Promise.resolve({ sma20Above: true, sma50Above: true }),
      getDaily: () => Promise.resolve([/* mock data */])
    }));

    const result = await runQuickScan('AAPL', 'test-key');
    
    expect(result.technicals.rsiSignal).toBe('oversold');
    expect(result.signals.bullish).toContain('RSI indicates oversold conditions');
  });

  it('should calculate correct score for bullish setup', async () => {
    // ... test implementation
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/analysis.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Analysis Flow', () => {
  test('should run Deep Dive analysis and show scenarios', async ({ page }) => {
    await page.goto('/');
    
    // Select stock
    await page.click('[data-testid="stock-TSLA"]');
    
    // Trigger analysis
    await page.click('[data-testid="analyze-button"]');
    
    // Wait for results
    await expect(page.locator('[data-testid="scenario-bull"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="scenario-bear"]')).toBeVisible();
    await expect(page.locator('[data-testid="scenario-base"]')).toBeVisible();
    
    // Verify probability adds up to ~100%
    const bullProb = await page.locator('[data-testid="bull-probability"]').textContent();
    const bearProb = await page.locator('[data-testid="bear-probability"]').textContent();
    const baseProb = await page.locator('[data-testid="base-probability"]').textContent();
    
    const total = parseInt(bullProb!) + parseInt(bearProb!) + parseInt(baseProb!);
    expect(total).toBeGreaterThanOrEqual(95);
    expect(total).toBeLessThanOrEqual(105);
  });
});
```

---

## 🚀 Deployment

### Vercel Konfiguration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Environment Variables

```env
# .env.example - Kopieren nach .env.local

# Financial Data APIs
VITE_ALPHA_VANTAGE_KEY=your_key_here
VITE_POLYGON_KEY=your_key_here

# AI APIs (Optional - User kann eigene Keys eingeben)
VITE_DEFAULT_AI_PROVIDER=anthropic

# Feature Flags
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_SOCIAL_SENTIMENT=false
VITE_MOCK_MODE=false
```

---

## 📋 Coding Standards

### Commit Messages
```
feat: Add real-time price updates via WebSocket
fix: Correct RSI calculation for edge cases
refactor: Extract chart logic into custom hook
docs: Update API integration guide
test: Add unit tests for scenario generation
```

### Component Template
```tsx
// src/components/example/ExampleComponent.tsx

import { memo } from 'react';
import { cn } from '@/utils/cn';

interface ExampleComponentProps {
  /** Primary text content */
  title: string;
  /** Optional callback when clicked */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ExampleComponent - Brief description
 * 
 * @example
 * <ExampleComponent title="Hello" onClick={() => console.log('clicked')} />
 */
export const ExampleComponent = memo(function ExampleComponent({
  title,
  onClick,
  className
}: ExampleComponentProps) {
  return (
    <div 
      className={cn(
        'bg-slate-900/50 rounded-xl p-4',
        'border border-slate-800/50',
        'transition-all duration-300',
        onClick && 'cursor-pointer hover:bg-slate-800/50',
        className
      )}
      onClick={onClick}
    >
      <h3 className="text-white font-semibold">{title}</h3>
    </div>
  );
});
```

---

## 🐛 Bekannte Limitierungen

1. **Alpha Vantage Rate Limits**: 5 API-Calls/Minute, 500/Tag (kostenlos)
2. **Browser Storage**: ~5MB LocalStorage Limit
3. **Real-time Updates**: WebSocket nur mit Polygon.io Premium
4. **AI Kosten**: Deep Dive ~$0.02-0.05 pro Analyse

---

## 📞 Hilfreiche Ressourcen

- [Alpha Vantage Docs](https://www.alphavantage.co/documentation/)
- [Polygon.io Docs](https://polygon.io/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Recharts Examples](https://recharts.org/en-US/examples)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## ✅ Checkliste vor Release

- [ ] Alle API Keys aus dem Code entfernt
- [ ] Error Boundaries implementiert
- [ ] Loading States überall vorhanden
- [ ] Offline-Modus getestet
- [ ] Lighthouse Score > 90
- [ ] iOS Safari getestet
- [ ] PWA Installation getestet
- [ ] Rate Limiting implementiert
- [ ] Analytics eingebaut
- [ ] Datenschutzerklärung erstellt

---

*Letzte Aktualisierung: Dezember 2025*
