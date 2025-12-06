/**
 * SettingsView - Multi-AI API Key Management & Preferences
 *
 * Organized by sections:
 * - Active Sources overview
 * - Required APIs (Anthropic)
 * - Market Data APIs (Alpha Vantage, Polygon)
 * - Intelligence Sources (Finnhub, Grok, Perplexity)
 * - Analysis Stats
 * - Preferences
 */

import { useState, memo, useMemo, useCallback } from 'react';
import {
  Key,
  Brain,
  Sparkles,
  BarChart3,
  Newspaper,
  MessageCircle,
  TrendingUp,
  Shield,
  Moon,
  Sun,
  Trash2,
  Activity,
  History,
  Clock,
  TrendingDown,
  Check,
  X,
} from 'lucide-react';
import { Header } from '@/components/layout';
import { ApiKeyInput, ActiveSourcesCard } from '@/components/settings';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { useAnalysisStore } from '@/stores/useAnalysisStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useQuoteCacheStore } from '@/stores/useQuoteCacheStore';
import { APP_VERSION, APP_NAME, APP_DESCRIPTION } from '@/constants/version';
import type { ApiKeys } from '@/types';

interface SettingsViewProps {
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// API KEY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

interface ApiKeyConfig {
  key: keyof ApiKeys;
  label: string;
  description: string;
  icon: typeof Brain;
  placeholder: string;
  required?: boolean;
  tier?: 'free' | 'premium';
  freeLink?: string;
}

const requiredApis: ApiKeyConfig[] = [
  {
    key: 'anthropic',
    label: 'Anthropic (Claude)',
    description: 'Powers the Master AI analysis and scenario generation',
    icon: Sparkles,
    placeholder: 'sk-ant-...',
    required: true,
  },
];

const marketDataApis: ApiKeyConfig[] = [
  {
    key: 'polygon',
    label: 'Polygon.io',
    description: 'Real-time quotes, bulk loading, options flow & greeks',
    icon: TrendingUp,
    placeholder: 'Your Polygon API key',
    tier: 'premium',
    freeLink: 'https://polygon.io/pricing',
  },
];

const intelligenceApis: ApiKeyConfig[] = [
  {
    key: 'openai',
    label: 'OpenAI (GPT)',
    description: 'News analysis & summarization',
    icon: Newspaper,
    placeholder: 'sk-...',
    freeLink: 'https://platform.openai.com/api-keys',
  },
  {
    key: 'gemini',
    label: 'Gemini (Google)',
    description: 'Web research & analyst data',
    icon: Sparkles,
    placeholder: 'Your Gemini API key',
    freeLink: 'https://aistudio.google.com/apikey',
  },
  {
    key: 'grok',
    label: 'Grok (xAI)',
    description: 'X/Twitter social sentiment',
    icon: MessageCircle,
    placeholder: 'xai-...',
    tier: 'premium',
  },
  {
    key: 'finnhub',
    label: 'Finnhub',
    description: 'Market data & company info (optional)',
    icon: BarChart3,
    placeholder: 'Your Finnhub API key',
    tier: 'free',
    freeLink: 'https://finnhub.io/register',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const SettingsView = memo(function SettingsView({
  onBack,
}: SettingsViewProps) {
  const {
    getApiKey,
    setApiKey,
    validateApiKey,
  } = useApiKeysStore();

  const { totalCost, totalAnalyses, clearHistory, analyses } = useAnalysisStore();
  const { theme, toggleTheme } = useSettingsStore();
  const cachedQuotes = useQuoteCacheStore((s) => s.quotes);

  // Calculate prediction status for an analysis
  const getPredictionStatus = useCallback((analysis: any) => {
    const entry = analyses[analysis.symbol]?.find(e => e.timestamp === analysis.timestamp);
    if (!entry?.result || !entry?.inputData?.price) return null;

    const priceAtAnalysis = entry.inputData.price;
    const cachedQuote = cachedQuotes[analysis.symbol];
    const currentPrice = cachedQuote?.price;

    if (!currentPrice || !priceAtAnalysis) return null;

    const result = entry.result as any;
    const scenarios = result.scenarios || result;
    if (!scenarios?.bull?.priceTarget) return null;

    // Parse targets
    const parseTarget = (targetStr: string): number | null => {
      if (!targetStr) return null;
      const match = targetStr.match(/([+-]?\d+(?:\.\d+)?)/g);
      if (match && match.length > 0) {
        return priceAtAnalysis * (1 + parseFloat(match[match.length - 1]) / 100);
      }
      return null;
    };

    const bullTarget = parseTarget(scenarios.bull.priceTarget);
    const bearTarget = parseTarget(scenarios.bear?.priceTarget);

    const actualChange = ((currentPrice - priceAtAnalysis) / priceAtAnalysis) * 100;
    const daysSince = Math.floor((Date.now() - new Date(analysis.timestamp).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince < 7) {
      return { status: 'Too early', color: 'text-slate-400', icon: '⏳', actualChange };
    }

    if (bullTarget && currentPrice >= bullTarget) {
      return { status: 'Bull Hit!', color: 'text-emerald-400', icon: '🎯', actualChange };
    }
    if (bearTarget && currentPrice <= bearTarget) {
      return { status: 'Bear Hit', color: 'text-rose-400', icon: '📉', actualChange };
    }
    return { status: 'In progress', color: 'text-blue-400', icon: '📊', actualChange };
  }, [analyses, cachedQuotes]);

  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
    // Initialize with stored keys
    const allApis = [...requiredApis, ...marketDataApis, ...intelligenceApis];
    const initial: Record<string, string> = {};
    allApis.forEach((field) => {
      initial[field.key] = getApiKey(field.key) || '';
    });
    return initial;
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSave = useCallback(
    (provider: keyof ApiKeys) => {
      const value = inputValues[provider];
      if (value) {
        setApiKey(provider, value);
        setSaved((prev) => ({ ...prev, [provider]: true }));
        setTimeout(
          () => setSaved((prev) => ({ ...prev, [provider]: false })),
          2000
        );
      }
    },
    [inputValues, setApiKey]
  );

  const handleInputChange = useCallback((key: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setShowClearConfirm(false);
  }, [clearHistory]);

  // Format currency
  const formatCurrency = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }, []);

  // Get all analyses sorted by timestamp (newest first)
  const allAnalyses = useMemo(() => {
    const allEntries: Array<{
      symbol: string;
      timestamp: string;
      cost: number;
      type: string;
      dominantScenario: string;
    }> = [];

    Object.entries(analyses).forEach(([symbol, entries]) => {
      entries.forEach(entry => {
        allEntries.push({
          symbol,
          timestamp: entry.timestamp,
          cost: entry.cost,
          type: entry.type,
          dominantScenario: entry.dominantScenario,
        });
      });
    });

    return allEntries.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 20); // Show last 20 analyses
  }, [analyses]);

  // Format relative time
  const formatRelativeTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <Header
        title="Settings"
        subtitle="Control Room"
        showBack
        onBack={onBack}
      />

      {/* Quick API Status Bar */}
      <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-xs font-medium">API STATUS</span>
          <div className="flex items-center gap-3">
            <ApiStatusBadge name="Polygon" configured={!!getApiKey('polygon')} />
            <ApiStatusBadge name="Claude" configured={!!getApiKey('anthropic')} />
            <ApiStatusBadge name="Gemini" configured={!!getApiKey('gemini')} />
            <ApiStatusBadge name="Grok" configured={!!getApiKey('grok')} />
            <ApiStatusBadge name="OpenAI" configured={!!getApiKey('openai')} />
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Active Sources Overview */}
        <ActiveSourcesCard />

        {/* Required APIs Section */}
        <Section
          icon={Key}
          iconGradient="from-rose-500/20 to-pink-500/20"
          iconColor="text-rose-400"
          title="Required"
          subtitle="Essential for AI analysis"
        >
          {requiredApis.map((api) => (
            <ApiKeyInput
              key={api.key}
              providerKey={api.key}
              label={api.label}
              description={api.description}
              icon={api.icon}
              placeholder={api.placeholder}
              value={inputValues[api.key] || ''}
              onChange={(value) => handleInputChange(api.key, value)}
              onSave={() => handleSave(api.key)}
              required={api.required}
              tier={api.tier}
              freeLink={api.freeLink}
              isValid={
                inputValues[api.key]
                  ? validateApiKey(api.key, inputValues[api.key])
                  : true
              }
              isSaved={saved[api.key] || false}
            />
          ))}
        </Section>

        {/* Market Data APIs Section */}
        <Section
          icon={BarChart3}
          iconGradient="from-blue-500/20 to-cyan-500/20"
          iconColor="text-blue-400"
          title="Market Data"
          subtitle="Stock prices & historical data"
        >
          {marketDataApis.map((api) => (
            <ApiKeyInput
              key={api.key}
              providerKey={api.key}
              label={api.label}
              description={api.description}
              icon={api.icon}
              placeholder={api.placeholder}
              value={inputValues[api.key] || ''}
              onChange={(value) => handleInputChange(api.key, value)}
              onSave={() => handleSave(api.key)}
              required={api.required}
              tier={api.tier}
              freeLink={api.freeLink}
              isValid={
                inputValues[api.key]
                  ? validateApiKey(api.key, inputValues[api.key])
                  : true
              }
              isSaved={saved[api.key] || false}
            />
          ))}
        </Section>

        {/* Intelligence Sources Section */}
        <Section
          icon={Brain}
          iconGradient="from-purple-500/20 to-indigo-500/20"
          iconColor="text-purple-400"
          title="Intelligence Sources"
          subtitle="News, sentiment & research"
        >
          {intelligenceApis.map((api) => (
            <ApiKeyInput
              key={api.key}
              providerKey={api.key}
              label={api.label}
              description={api.description}
              icon={api.icon}
              placeholder={api.placeholder}
              value={inputValues[api.key] || ''}
              onChange={(value) => handleInputChange(api.key, value)}
              onSave={() => handleSave(api.key)}
              required={api.required}
              tier={api.tier}
              freeLink={api.freeLink}
              isValid={
                inputValues[api.key]
                  ? validateApiKey(api.key, inputValues[api.key])
                  : true
              }
              isSaved={saved[api.key] || false}
            />
          ))}
        </Section>

        {/* Security Notice */}
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Shield size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-200 text-sm font-medium">Security Notice</p>
            <p className="text-amber-200/70 text-xs mt-1">
              API keys are stored in your browser's localStorage and never sent
              to our servers. For maximum security, use keys with limited
              permissions.
            </p>
          </div>
        </div>

        {/* Analysis Stats Section */}
        <Section
          icon={Activity}
          iconGradient="from-emerald-500/20 to-teal-500/20"
          iconColor="text-emerald-400"
          title="Analysis Stats"
          subtitle="Usage tracking"
        >
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Analyses</span>
              <span className="text-white font-medium">{totalAnalyses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Cost</span>
              <span className="text-white font-medium">
                {formatCurrency.format(totalCost)}
              </span>
            </div>
            <div className="border-t border-slate-800/50 pt-4">
              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Are you sure?</span>
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-500/30 transition-colors"
                  >
                    Yes, clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 bg-slate-800/50 text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  Clear Analysis History
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Analysis History Section */}
        <Section
          icon={History}
          iconGradient="from-blue-500/20 to-indigo-500/20"
          iconColor="text-blue-400"
          title="Analysis History"
          subtitle="Past AI analyses"
        >
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden">
            {allAnalyses.length === 0 ? (
              <div className="p-6 text-center">
                <History size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No analyses yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  Run a Scope Analysis to see history here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {allAnalyses.map((analysis, index) => {
                  const predictionStatus = getPredictionStatus(analysis);
                  return (
                    <div
                      key={`${analysis.symbol}-${analysis.timestamp}-${index}`}
                      className="p-3 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Scenario Indicator */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            analysis.dominantScenario === 'bull'
                              ? 'bg-emerald-500/20'
                              : analysis.dominantScenario === 'bear'
                              ? 'bg-rose-500/20'
                              : 'bg-blue-500/20'
                          }`}>
                            {analysis.dominantScenario === 'bull' ? (
                              <TrendingUp size={16} className="text-emerald-400" />
                            ) : analysis.dominantScenario === 'bear' ? (
                              <TrendingDown size={16} className="text-rose-400" />
                            ) : (
                              <Activity size={16} className="text-blue-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">
                                {analysis.symbol}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                analysis.dominantScenario === 'bull'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : analysis.dominantScenario === 'bear'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {analysis.dominantScenario}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs mt-0.5">
                              <Clock size={10} />
                              <span>{formatRelativeTime(analysis.timestamp)}</span>
                              {predictionStatus && (
                                <>
                                  <span>•</span>
                                  <span className={predictionStatus.actualChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                    {predictionStatus.actualChange >= 0 ? '+' : ''}{predictionStatus.actualChange.toFixed(1)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {predictionStatus ? (
                            <span className={`${predictionStatus.color} text-sm flex items-center gap-1`}>
                              {predictionStatus.icon} {predictionStatus.status}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">
                              {formatCurrency.format(analysis.cost)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Section>

        {/* Appearance Section */}
        <Section
          icon={Moon}
          iconGradient="from-slate-500/20 to-slate-600/20"
          iconColor="text-slate-400"
          title="Appearance"
          subtitle="Visual preferences"
        >
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800/50">
                  {theme === 'light' ? (
                    <Sun size={18} className="text-amber-400" />
                  ) : (
                    <Moon size={18} className="text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium">Theme</h3>
                  <p className="text-slate-500 text-xs">
                    {theme === 'light' ? 'Light mode' : 'Dark mode'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-14 h-8 rounded-full transition-all duration-300 ${
                  theme === 'light' ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    theme === 'light' ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Section>

        {/* About Section */}
        <div className="pt-6 border-t border-slate-800/50">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles size={32} className="text-white" />
            </div>
            <h3 className="text-white font-bold text-xl">{APP_NAME}</h3>
            <p className="text-slate-500 text-sm mt-1">Version {APP_VERSION}</p>
            <p className="text-slate-600 text-xs mt-4">
              {APP_DESCRIPTION}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface SectionProps {
  icon: typeof Brain;
  iconGradient: string;
  iconColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const Section = memo(function Section({
  icon: Icon,
  iconGradient,
  iconColor,
  title,
  subtitle,
  children,
}: SectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${iconGradient}`}>
          <Icon size={20} className={iconColor} />
        </div>
        <div>
          <h2 className="text-white font-semibold">{title}</h2>
          <p className="text-slate-500 text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
});

// API Status Badge Component
interface ApiStatusBadgeProps {
  name: string;
  configured: boolean;
}

const ApiStatusBadge = memo(function ApiStatusBadge({
  name,
  configured,
}: ApiStatusBadgeProps) {
  return (
    <div className="flex items-center gap-1">
      {configured ? (
        <Check size={12} className="text-emerald-400" />
      ) : (
        <X size={12} className="text-slate-600" />
      )}
      <span
        className={`text-xs ${
          configured ? 'text-emerald-400' : 'text-slate-600'
        }`}
      >
        {name}
      </span>
    </div>
  );
});

export default SettingsView;
