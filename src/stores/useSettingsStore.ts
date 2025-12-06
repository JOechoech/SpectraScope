/**
 * Settings Store - User preferences
 *
 * Manages visual and behavior settings including theme mode.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'dark' | 'light';

// Apply theme to document
const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (theme === 'light') {
    root.classList.add('light-theme');
    root.classList.remove('dark-theme');
    document.body.style.backgroundColor = '#f5f5f7';
  } else {
    root.classList.add('dark-theme');
    root.classList.remove('light-theme');
    document.body.style.backgroundColor = '#000000';
  }
};

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark', // Default to dark mode

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        applyTheme(newTheme);
      },
    }),
    {
      name: 'spectrascope-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Apply theme on initial load after hydration
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Apply theme immediately on module load (before React renders)
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('spectrascope-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      const theme = parsed.state?.theme || 'dark';
      applyTheme(theme);
    } else {
      // Default is dark
      applyTheme('dark');
    }
  } catch {
    applyTheme('dark');
  }
}
