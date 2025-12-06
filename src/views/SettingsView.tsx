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
  Search,
  TrendingUp,
  Shield,
  Moon,
  Sun,
  Trash2,
  Activity,
} from 'lucide-react';
import { Header } from '@/components/layout';
import { ApiKeyInput, ActiveSourcesCard } from '@/components/settings';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import { useAnalysisStore } from '@/stores/useAnalysisStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
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
    key: 'finnhub',
    label: 'Finnhub',
    description: 'FREE market news & company data (60 calls/min)',
    icon: Newspaper,
    placeholder: 'Your Finnhub API key',
    tier: 'free',
    freeLink: 'https://finnhub.io/register',
  },
  {
    key: 'newsapi',
    label: 'NewsAPI',
    description: 'News headlines & sentiment analysis',
    icon: Newspaper,
    placeholder: 'Your 32-character key',
    freeLink: 'https://newsapi.org/register',
  },
  {
    key: 'mediastack',
    label: 'MediaStack',
    description: 'Additional news coverage',
    icon: Newspaper,
    placeholder: 'Your MediaStack key',
    tier: 'free',
    freeLink: 'https://mediastack.com/signup',
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
    key: 'gemini',
    label: 'Gemini (Google)',
    description: 'Web research & analyst data',
    icon: Sparkles,
    placeholder: 'Your Gemini API key',
    freeLink: 'https://aistudio.google.com/apikey',
  },
  {
    key: 'perplexity',
    label: 'Perplexity',
    description: 'Deep web research',
    icon: Search,
    placeholder: 'pplx-...',
    tier: 'premium',
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

  const { totalCost, totalAnalyses, clearHistory } = useAnalysisStore();
  const { theme, toggleTheme } = useSettingsStore();

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

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <Header
        title="Settings"
        subtitle="Control Room"
        showBack
        onBack={onBack}
      />

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

export default SettingsView;
