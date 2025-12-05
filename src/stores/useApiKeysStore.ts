import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';
import type { ApiKeys, AiProvider } from '@/types';

// Simple obfuscation for localStorage (not encryption, but better than plaintext)
const encode = (str: string): string => {
  if (!str) return '';
  return btoa(str.split('').reverse().join(''));
};

const decode = (str: string): string => {
  if (!str) return '';
  try {
    return atob(str).split('').reverse().join('');
  } catch {
    return '';
  }
};

interface ApiKeysState {
  // Encoded keys (stored)
  encodedKeys: Partial<Record<keyof ApiKeys, string>>;
  
  // Preferences
  defaultAiProvider: AiProvider;
  
  // Actions
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  getApiKey: (provider: keyof ApiKeys) => string | null;
  removeApiKey: (provider: keyof ApiKeys) => void;
  hasApiKey: (provider: keyof ApiKeys) => boolean;
  validateApiKey: (provider: keyof ApiKeys, key: string) => boolean;
  setDefaultAiProvider: (provider: AiProvider) => void;
  
  // Bulk operations
  getAllProviders: () => (keyof ApiKeys)[];
  clearAllKeys: () => void;
}

// Validation patterns for different API keys
const keyPatterns: Partial<Record<keyof ApiKeys, RegExp>> = {
  alphavantage: /^[A-Z0-9]{16}$/,
  polygon: /^[a-zA-Z0-9_]{32}$/,
  finnhub: /^[a-z0-9]{20,}$/,
  anthropic: /^sk-ant-[a-zA-Z0-9-]{90,}$/,
  openai: /^sk-[a-zA-Z0-9]{48,}$/,
  twitter: /^[a-zA-Z0-9]{50,}$/,
  grok: /^xai-[a-zA-Z0-9]{48,}$/,           // xAI API key pattern
  gemini: /^[a-zA-Z0-9_-]{39}$/,            // Google Gemini API key pattern
  perplexity: /^pplx-[a-zA-Z0-9]{48,}$/,    // Perplexity API key pattern
  newsapi: /^[a-z0-9]{32}$/,                // NewsAPI key pattern
  mediastack: /^[a-z0-9]{32}$/,             // MediaStack API key pattern
};

// Track hydration status
let isHydrated = false;
const hydrationListeners = new Set<() => void>();

export const onHydrationComplete = (callback: () => void) => {
  if (isHydrated) {
    callback();
    return () => {};
  }
  hydrationListeners.add(callback);
  return () => hydrationListeners.delete(callback);
};

export const getIsHydrated = () => isHydrated;

export const useApiKeysStore = create<ApiKeysState>()(
  persist(
    (set, get) => ({
      encodedKeys: {},
      defaultAiProvider: 'anthropic',

      setApiKey: (provider, key) =>
        set((state) => ({
          encodedKeys: {
            ...state.encodedKeys,
            [provider]: encode(key),
          },
        })),

      getApiKey: (provider) => {
        const encoded = get().encodedKeys[provider];
        return encoded ? decode(encoded) : null;
      },

      removeApiKey: (provider) =>
        set((state) => {
          const { [provider]: _, ...rest } = state.encodedKeys;
          return { encodedKeys: rest };
        }),

      hasApiKey: (provider) => {
        const encoded = get().encodedKeys[provider];
        return !!encoded && decode(encoded).length > 0;
      },

      validateApiKey: (provider, key) => {
        const pattern = keyPatterns[provider];
        if (!pattern) return key.length > 0; // Fallback: just check non-empty
        return pattern.test(key);
      },

      setDefaultAiProvider: (provider) =>
        set({ defaultAiProvider: provider }),

      getAllProviders: () => {
        return Object.keys(get().encodedKeys).filter(
          (key) => get().hasApiKey(key as keyof ApiKeys)
        ) as (keyof ApiKeys)[];
      },

      clearAllKeys: () => set({ encodedKeys: {} }),
    }),
    {
      name: 'spectrascope-api-keys',
      partialize: (state) => ({
        encodedKeys: state.encodedKeys,
        defaultAiProvider: state.defaultAiProvider,
      }),
      onRehydrateStorage: () => {
        return () => {
          isHydrated = true;
          hydrationListeners.forEach((cb) => cb());
          hydrationListeners.clear();
        };
      },
    }
  )
);

// Hook for checking if all required keys are configured
export const useRequiredKeys = () => {
  const { hasApiKey, defaultAiProvider } = useApiKeysStore();

  const hasFinancialKey = hasApiKey('alphavantage') || hasApiKey('polygon');
  const hasAiKey =
    (defaultAiProvider === 'anthropic' && hasApiKey('anthropic')) ||
    (defaultAiProvider === 'openai' && hasApiKey('openai'));

  return {
    hasFinancialKey,
    hasAiKey,
    isFullyConfigured: hasFinancialKey && hasAiKey,
    missingKeys: {
      financial: !hasFinancialKey,
      ai: !hasAiKey,
    },
  };
};

// Hook to wait for store hydration
export const useStoreHydration = () => {
  const [hydrated, setHydrated] = useState(getIsHydrated());

  useEffect(() => {
    if (hydrated) return;

    const unsubscribe = onHydrationComplete(() => {
      setHydrated(true);
    });

    // Double-check in case hydration completed between render and effect
    if (getIsHydrated()) {
      setHydrated(true);
    }

    return unsubscribe;
  }, [hydrated]);

  return hydrated;
};
