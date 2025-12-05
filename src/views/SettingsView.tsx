import { useState, memo } from 'react';
import {
  Key,
  Brain,
  Sparkles,
  BarChart3,
  Activity,
  Eye,
  EyeOff,
  Check,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';
import { Header } from '@/components/layout';
import { useApiKeysStore } from '@/stores/useApiKeysStore';
import type { ApiKeys, AiProvider } from '@/types';

interface SettingsViewProps {
  onBack: () => void;
}

interface ApiKeyField {
  key: keyof ApiKeys;
  label: string;
  description: string;
  icon: typeof Brain;
  placeholder: string;
}

const apiKeyFields: ApiKeyField[] = [
  {
    key: 'anthropic',
    label: 'Anthropic API Key',
    description: 'Powers the AI reasoning engine for scenario generation',
    icon: Sparkles,
    placeholder: 'sk-ant-...',
  },
  {
    key: 'openai',
    label: 'OpenAI API Key',
    description: 'Alternative AI provider for analysis',
    icon: Brain,
    placeholder: 'sk-...',
  },
  {
    key: 'alphavantage',
    label: 'Alpha Vantage API Key',
    description: 'Financial data provider for market data',
    icon: BarChart3,
    placeholder: 'Your API key (16 chars)',
  },
  {
    key: 'twitter',
    label: 'Twitter/X API Key (Optional)',
    description: 'For social sentiment analysis',
    icon: Activity,
    placeholder: 'Optional',
  },
];

/**
 * SettingsView - API Key Management & Preferences
 * Uses Zustand store for persistent API key storage
 */
export const SettingsView = memo(function SettingsView({
  onBack,
}: SettingsViewProps) {
  const {
    getApiKey,
    setApiKey,
    validateApiKey,
    defaultAiProvider,
    setDefaultAiProvider,
  } = useApiKeysStore();

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
    // Initialize with stored keys
    const initial: Record<string, string> = {};
    apiKeyFields.forEach((field) => {
      initial[field.key] = getApiKey(field.key) || '';
    });
    return initial;
  });
  const [darkMode, setDarkMode] = useState(true);

  const handleSave = (provider: keyof ApiKeys) => {
    const value = inputValues[provider];
    if (value) {
      setApiKey(provider, value);
      setSaved({ ...saved, [provider]: true });
      setTimeout(() => setSaved({ ...saved, [provider]: false }), 2000);
    }
  };

  const toggleShowKey = (key: string) => {
    setShowKeys({ ...showKeys, [key]: !showKeys[key] });
  };

  const handleInputChange = (key: string, value: string) => {
    setInputValues({ ...inputValues, [key]: value });
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <Header
        title="Settings"
        subtitle="Control Room"
        showBack
        onBack={onBack}
      />

      {/* API Keys Section */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Key size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">API Key Management</h2>
            <p className="text-slate-500 text-sm">
              Stored locally in your browser
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {apiKeyFields.map((field) => (
            <ApiKeyInput
              key={field.key}
              field={field}
              value={inputValues[field.key] || ''}
              showKey={showKeys[field.key] || false}
              isSaved={saved[field.key] || false}
              isValid={
                inputValues[field.key]
                  ? validateApiKey(field.key, inputValues[field.key])
                  : true
              }
              onChange={(value) => handleInputChange(field.key, value)}
              onToggleShow={() => toggleShowKey(field.key)}
              onSave={() => handleSave(field.key)}
            />
          ))}
        </div>

        {/* Security Notice */}
        <div className="mt-4 flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
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
      </div>

      {/* AI Provider Selection */}
      <div className="px-5 py-6 border-t border-slate-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Brain size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">AI Provider</h2>
            <p className="text-slate-500 text-sm">
              Select default AI for analysis
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <ProviderButton
            provider="anthropic"
            label="Anthropic Claude"
            isActive={defaultAiProvider === 'anthropic'}
            onClick={() => setDefaultAiProvider('anthropic')}
          />
          <ProviderButton
            provider="openai"
            label="OpenAI GPT"
            isActive={defaultAiProvider === 'openai'}
            onClick={() => setDefaultAiProvider('openai')}
          />
        </div>
      </div>

      {/* Appearance Section */}
      <div className="px-5 py-6 border-t border-slate-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Moon size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Appearance</h2>
            <p className="text-slate-500 text-sm">Customize the look and feel</p>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800/50">
                {darkMode ? (
                  <Moon size={18} className="text-slate-400" />
                ) : (
                  <Sun size={18} className="text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="text-white font-medium">Dark Mode</h3>
                <p className="text-slate-500 text-xs">OLED-optimized dark theme</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-14 h-8 rounded-full transition-all duration-300 ${
                darkMode ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  darkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="px-5 py-6 border-t border-slate-800/50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles size={32} className="text-white" />
          </div>
          <h3 className="text-white font-bold text-xl">SpectraScope</h3>
          <p className="text-slate-500 text-sm mt-1">Version 0.1.0</p>
          <p className="text-slate-600 text-xs mt-4">
            AI-Powered Investment Analysis
          </p>
        </div>
      </div>
    </div>
  );
});

// API Key Input Component
interface ApiKeyInputProps {
  field: ApiKeyField;
  value: string;
  showKey: boolean;
  isSaved: boolean;
  isValid: boolean;
  onChange: (value: string) => void;
  onToggleShow: () => void;
  onSave: () => void;
}

const ApiKeyInput = memo(function ApiKeyInput({
  field,
  value,
  showKey,
  isSaved,
  isValid,
  onChange,
  onToggleShow,
  onSave,
}: ApiKeyInputProps) {
  const Icon = field.icon;

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-xl bg-slate-800/50">
          <Icon size={18} className="text-slate-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium">{field.label}</h3>
          <p className="text-slate-500 text-xs mt-0.5">{field.description}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`input-field pr-12 ${
              value && !isValid ? 'border-rose-500/50 ring-1 ring-rose-500/30' : ''
            }`}
          />
          <button
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            {showKey ? (
              <EyeOff size={16} className="text-slate-500" />
            ) : (
              <Eye size={16} className="text-slate-500" />
            )}
          </button>
        </div>
        <button
          onClick={onSave}
          disabled={!value || !isValid}
          className={`px-4 py-3 rounded-xl font-medium transition-all ${
            isSaved
              ? 'bg-emerald-500/20 text-emerald-400'
              : value && isValid
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
          }`}
        >
          {isSaved ? <Check size={18} /> : 'Save'}
        </button>
      </div>
    </div>
  );
});

// Provider Button Component
interface ProviderButtonProps {
  provider: AiProvider;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const ProviderButton = memo(function ProviderButton({
  provider: _provider,
  label,
  isActive,
  onClick,
}: ProviderButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
        isActive
          ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
      }`}
    >
      {label}
    </button>
  );
});

export default SettingsView;
