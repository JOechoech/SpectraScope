/**
 * API Keys Store v2 - Simplified, No Alpha Vantage
 *
 * Stores API keys for various services using Zustand persist middleware.
 * Keys are encoded (not encrypted) in localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';
import type { ApiKeys, AiProvider } from '@/types';

// Simple obfuscation for localStorage
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
  encodedKeys: Partial<Record<keyof ApiKeys, string>>;
  defaultAiProvider: AiProvider;

  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  getApiKey: (provider: keyof ApiKeys) => string | null;
  removeApiKey: (provider: keyof ApiKeys) => void;
  hasApiKey: (provider: keyof ApiKeys) => boolean;
  validateApiKey: (provider: keyof ApiKeys, key: string) => boolean;
  setDefaultAiProvider: (provider: AiProvider) => void;
  getAllProviders: () => (keyof ApiKeys)[];
  clearAllKeys: () => void;
}

// Validation patterns (NO alphavantage)
const keyPatterns: Partial<Record<keyof ApiKeys, RegExp>> = {
  polygon: /^[a-zA-Z0-9_]{20,}$/,
  finnhub: /^[a-z0-9]{15,}$/,
  anthropic: /^sk-ant-[a-zA-Z0-9-]{40,}$/,
  openai: /^sk-[a-zA-Z0-9]{20,}$/,
  grok: /^xai-[a-zA-Z0-9]{20,}$/,
  gemini: /^[a-zA-Z0-9_-]{30,}$/,
  perplexity: /^pplx-[a-zA-Z0-9]{20,}$/,
  newsapi: /^[a-z0-9]{20,}$/,
  mediastack: /^[a-z0-9]{20,}$/,
};

// Hydration tracking
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

// STORE VERSION - bump to force fresh localStorage
const STORE_VERSION = 2;

export const useApiKeysStore = create<ApiKeysState>()(
  persist(
    (set, get) => ({
      encodedKeys: {},
      defaultAiProvider: 'anthropic',

      setApiKey: (provider, key) => {
        if (!key || key.trim() === '') {
          // If empty, remove the key instead
          get().removeApiKey(provider);
          return;
        }
        set((state) => ({
          encodedKeys: {
            ...state.encodedKeys,
            [provider]: encode(key.trim()),
          },
        }));
      },

      getApiKey: (provider) => {
        const encoded = get().encodedKeys[provider];
        if (!encoded) return null;
        const decoded = decode(encoded);
        return decoded && decoded.length > 0 ? decoded : null;
      },

      removeApiKey: (provider) =>
        set((state) => {
          const newKeys = { ...state.encodedKeys };
          delete newKeys[provider];
          return { encodedKeys: newKeys };
        }),

      hasApiKey: (provider) => {
        const key = get().getApiKey(provider);
        return !!key && key.length > 0;
      },

      validateApiKey: (provider, key) => {
        if (!key || key.trim() === '') return false;
        const pattern = keyPatterns[provider];
        if (!pattern) return key.length > 5;
        return pattern.test(key.trim());
      },

      setDefaultAiProvider: (provider) =>
        set({ defaultAiProvider: provider }),

      getAllProviders: () => {
        const keys = get().encodedKeys;
        return Object.keys(keys).filter((k) => {
          const decoded = decode(keys[k as keyof ApiKeys] || '');
          return decoded && decoded.length > 0;
        }) as (keyof ApiKeys)[];
      },

      clearAllKeys: () => set({ encodedKeys: {} }),
    }),
    {
      name: 'spectrascope-api-keys-v2',
      version: STORE_VERSION,
      partialize: (state) => ({
        encodedKeys: state.encodedKeys,
        defaultAiProvider: state.defaultAiProvider,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          // Clean up any empty or invalid keys on rehydration
          if (state?.encodedKeys) {
            const cleanedKeys: Partial<Record<keyof ApiKeys, string>> = {};
            for (const [key, value] of Object.entries(state.encodedKeys)) {
              if (value && decode(value).length > 0) {
                cleanedKeys[key as keyof ApiKeys] = value;
              }
            }
            state.encodedKeys = cleanedKeys;
          }
          isHydrated = true;
          hydrationListeners.forEach((cb) => cb());
          hydrationListeners.clear();
        };
      },
      migrate: (persistedState: unknown, version: number) => {
        // Force fresh start on version bump
        if (version < STORE_VERSION) {
          console.log('[ApiKeys] Migrating from version', version, 'to', STORE_VERSION);
          return { encodedKeys: {}, defaultAiProvider: 'anthropic' };
        }
        return persistedState as ApiKeysState;
      },
    }
  )
);

// Hook for checking required keys (Polygon only for financial)
export const useRequiredKeys = () => {
  const { hasApiKey, defaultAiProvider } = useApiKeysStore();

  const hasFinancialKey = hasApiKey('polygon');
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

    if (getIsHydrated()) {
      setHydrated(true);
    }

    return unsubscribe;
  }, [hydrated]);

  return hydrated;
};
