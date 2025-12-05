# SpectraScope 🔭

> AI-Powered Investment Analysis with Cost Control

<p align="center">
  <img src="docs/screenshots/hero.png" alt="SpectraScope Hero" width="800">
</p>

## ✨ Features

- **📊 Watchlist**: Track your favorite stocks with real-time sparklines
- **📈 Interactive Charts**: Candlestick and area charts with Recharts
- **🤖 AI Analysis Engine**: Generate 3 narrative scenarios (Bull, Bear, Base Case)
- **💰 Cost Control**: Only trigger expensive AI analyses when you need them
- **🌙 OLED Dark Mode**: Premium Apple-like aesthetic
- **📱 PWA Ready**: Install on iOS, Android, or desktop

## 🎯 Core Value Proposition

SpectraScope aggregates financial data and generates **3 distinct narrative scenarios** using AI. Crucially, it gives users **cost control** by only triggering expensive AI analyses manually.

### Analysis Modes

| Mode | Cost | Description |
|------|------|-------------|
| **Quick Scan** | Low | Technical indicators only (RSI, MACD, SMA) |
| **Deep Dive** | High | Full AI analysis with 3 scenarios |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/spectrascope.git
cd spectrascope

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Configuration

### API Keys

SpectraScope requires API keys for financial data and AI analysis. Keys are stored securely in your browser's localStorage.

1. **Financial Data**: [Alpha Vantage](https://www.alphavantage.co/support/#api-key) (free tier available)
2. **AI Engine**: [Anthropic Claude](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/)

Configure keys in the Settings view within the app.

### Environment Variables

```env
# .env.local
VITE_MOCK_MODE=false          # Set to true for demo mode
VITE_DEFAULT_AI_PROVIDER=anthropic
```

## 📁 Project Structure

```
spectrascope/
├── src/
│   ├── components/     # UI components
│   ├── views/          # Page views
│   ├── services/       # API integrations
│   ├── stores/         # Zustand state
│   ├── hooks/          # Custom hooks
│   ├── types/          # TypeScript types
│   └── utils/          # Helpers
├── public/             # Static assets
└── tests/              # Test files
```

## 🎨 Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `bg-black` | `#000000` | Primary background (OLED) |
| `emerald-500` | `#10b981` | Bull/Positive |
| `rose-500` | `#f43f5e` | Bear/Negative |
| `blue-500` | `#3b82f6` | Neutral/Action |

### Glassmorphism

```css
.glass-card {
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(51, 65, 85, 0.5);
}
```

## 📱 Screenshots

<p align="center">
  <img src="docs/screenshots/watchlist.png" alt="Watchlist" width="280">
  <img src="docs/screenshots/detail.png" alt="Detail View" width="280">
  <img src="docs/screenshots/analysis.png" alt="AI Analysis" width="280">
</p>

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/spectrascope)

### Manual Build

```bash
npm run build
# Output in dist/
```

## 🛡️ Security

- API keys are stored locally in your browser (never sent to our servers)
- All financial data requests go directly from your browser to the API providers
- No user data is collected or tracked

## 📄 License

MIT © 2025

## 🙏 Acknowledgments

- [Recharts](https://recharts.org/) for beautiful charts
- [Lucide](https://lucide.dev/) for icons
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Anthropic Claude](https://www.anthropic.com/) for AI analysis

---

<p align="center">
  Made with ❤️ for retail investors
</p>
