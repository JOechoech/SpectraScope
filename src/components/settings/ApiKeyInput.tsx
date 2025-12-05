/**
 * ApiKeyInput - Enhanced API Key Input Component
 *
 * Features:
 * - Password-style input with show/hide toggle
 * - "Get free key" link for free tier providers
 * - Premium badge for premium providers
 * - Connection status indicator
 * - Optional test connection button
 */

import { memo, useState } from 'react';
import {
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  Star,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ApiKeyInputProps {
  /** Provider key name */
  providerKey: string;
  /** Display label */
  label: string;
  /** Description of what this API does */
  description: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Save handler */
  onSave: () => void;
  /** Icon component */
  icon?: LucideIcon;
  /** Placeholder text */
  placeholder?: string;
  /** Is this a required key? */
  required?: boolean;
  /** Tier: free or premium */
  tier?: 'free' | 'premium';
  /** Link to get a free API key */
  freeLink?: string;
  /** Is the key valid? */
  isValid?: boolean;
  /** Was just saved? */
  isSaved?: boolean;
  /** Optional test connection function */
  testConnection?: () => Promise<boolean>;
}

export const ApiKeyInput = memo(function ApiKeyInput({
  label,
  description,
  value,
  onChange,
  onSave,
  icon: Icon,
  placeholder = 'Enter API key...',
  required = false,
  tier = 'free',
  freeLink,
  isValid = true,
  isSaved = false,
  testConnection,
}: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const hasKey = value.length > 0;

  const handleTest = async () => {
    if (!testConnection) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection();
      setTestResult(result);
    } catch {
      setTestResult(false);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="p-2 rounded-xl bg-slate-800/50">
              <Icon size={18} className="text-slate-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium">{label}</h3>
              {required && (
                <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded font-medium">
                  Required
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">{description}</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {tier === 'premium' && (
            <div className="flex items-center gap-1 text-amber-400 text-xs">
              <Star size={12} className="fill-amber-400" />
              <span>Premium</span>
            </div>
          )}
          {hasKey && isValid && (
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <Check size={14} />
              <span>Connected</span>
            </div>
          )}
          {hasKey && !isValid && (
            <div className="flex items-center gap-1 text-rose-400 text-xs">
              <AlertCircle size={14} />
              <span>Invalid</span>
            </div>
          )}
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`input-field pr-12 ${
              value && !isValid
                ? 'border-rose-500/50 ring-1 ring-rose-500/30'
                : ''
            }`}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
            type="button"
          >
            {showKey ? (
              <EyeOff size={16} className="text-slate-500" />
            ) : (
              <Eye size={16} className="text-slate-500" />
            )}
          </button>
        </div>

        {/* Test button (if available) */}
        {testConnection && hasKey && isValid && (
          <button
            onClick={handleTest}
            disabled={isTesting}
            className={`px-3 py-3 rounded-xl font-medium transition-all min-w-[70px] ${
              testResult === true
                ? 'bg-emerald-500/20 text-emerald-400'
                : testResult === false
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
            type="button"
          >
            {isTesting ? (
              <Loader2 size={16} className="animate-spin mx-auto" />
            ) : testResult === true ? (
              <Check size={16} className="mx-auto" />
            ) : (
              'Test'
            )}
          </button>
        )}

        {/* Save button */}
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
          type="button"
        >
          {isSaved ? <Check size={18} /> : 'Save'}
        </button>
      </div>

      {/* Free link */}
      {freeLink && !hasKey && (
        <a
          href={freeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink size={12} />
          Get a free API key
        </a>
      )}
    </div>
  );
});

export default ApiKeyInput;
