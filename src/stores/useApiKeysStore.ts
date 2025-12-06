/**
 * API Keys Store - Persistent API Key Storage
 *
 * Stores API keys for various services using Zustand persist middleware.
 * Keys are encoded (not encrypted) in localStorage with backup storage
 * to prevent data loss.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

// Backup key storage helpers - redundant storage for reliability
const backupKey = (provider: string, key: string) => {
  try {
    localStorage.setItem(`spectrascope-backup-${provider}`, encode(key));
  } catch {
    // Silent fail - backup is optional
  }
};

const getBackupKey = (provider: string): string | null => {
  try {
    const encoded = localStorage.getItem(`spectrascope-backup-${provider}`);
    if (encoded) {
      return decode(encoded);
    }
  } catch {
    // Silent fail
  }
  return null;
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

// Validation patterns
const keyPatterns: Partial<Record<keyof ApiKeys, RegExp>> = {
  polygon: /^[a-zA-Z0-9_]{20,}$/,
  finnhub: /^[a-z0-9]{15,}$/,
  anthropic: /^sk-ant-[a-zA-Z0-9-]{40,}$/,
  openai: /^sk-[a-zA-Z0-9]{20,}$/,
  grok: /^xai-[a-zA-Z0-9]{20,}$/,
  gemini: /^[a-zA-Z0-9_-]{30,}$/,
  perplexity: /^pplx-[a-zA-Z0-9]{20,}$/,
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
        const trimmedKey = key.trim();
        // Store in main state
        set((state) => ({
          encodedKeys: {
            ...state.encodedKeys,
            [provider]: encode(trimmedKey),
          },
        }));
        // Also backup to separate localStorage key for reliability
        backupKey(provider, trimmedKey);
      },

      getApiKey: (provider) => {
        const encoded = get().encodedKeys[provider];
        if (encoded) {
          const decoded = decode(encoded);
          if (decoded && decoded.length > 0) {
            return decoded;
          }
        }
        // Try backup if main store doesn't have it
        const backup = getBackupKey(provider);
        if (backup) {
          // Restore to main store
          set((state) => ({
            encodedKeys: {
              ...state.encodedKeys,
              [provider]: encode(backup),
            },
          }));
          return backup;
        }
        return null;
      },

      removeApiKey: (provider) => {
        set((state) => {
          const newKeys = { ...state.encodedKeys };
          delete newKeys[provider];
          return { encodedKeys: newKeys };
        });
        // Also remove backup
        try {
          localStorage.removeItem(`spectrascope-backup-${provider}`);
        } catch {
          // Silent fail
        }
      },

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
      name: 'spectrascope-api-keys',
      storage: createJSONStorage(() => localStorage),
      // NO version number - don't break existing storage!
      partialize: (state) => ({
        encodedKeys: state.encodedKeys,
        defaultAiProvider: state.defaultAiProvider,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          // Recover keys from backup if main store is empty
          if (state) {
            const providers: (keyof ApiKeys)[] = [
              'polygon', 'finnhub', 'anthropic', 'openai',
              'grok', 'gemini', 'perplexity'
            ];

            providers.forEach((provider) => {
              const hasKey = state.encodedKeys[provider] && decode(state.encodedKeys[provider] || '').length > 0;
              if (!hasKey) {
                const backup = getBackupKey(provider);
                if (backup) {
                  state.encodedKeys[provider] = encode(backup);
                }
              }
            });
          }

          isHydrated = true;
          hydrationListeners.forEach((cb) => cb());
          hydrationListeners.clear();
        };
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
