/**
 * Settings Store - User preferences
 *
 * Manages visual and behavior settings including OLED mode.
 * OLED mode applies true black backgrounds for OLED screens.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Apply OLED mode to document
const applyOledMode = (enabled: boolean) => {
  if (typeof document === 'undefined') return;

  if (enabled) {
    document.documentElement.classList.add('oled-mode');
    document.body.style.backgroundColor = '#000000';
  } else {
    document.documentElement.classList.remove('oled-mode');
    document.body.style.backgroundColor = '#0f172a'; // slate-900
  }
};

interface SettingsState {
  oledMode: boolean;
  setOledMode: (enabled: boolean) => void;
  toggleOledMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      oledMode: true, // Default to OLED mode (true black backgrounds)

      setOledMode: (enabled) => {
        set({ oledMode: enabled });
        applyOledMode(enabled);
      },

      toggleOledMode: () => {
        const newValue = !get().oledMode;
        set({ oledMode: newValue });
        applyOledMode(newValue);
      },
    }),
    {
      name: 'spectrascope-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Apply OLED mode on initial load after hydration
        if (state) {
          applyOledMode(state.oledMode);
        }
      },
    }
  )
);

// Apply OLED mode immediately on module load (before React renders)
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('spectrascope-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.oledMode !== false) {
        // Default is true, so apply OLED unless explicitly disabled
        document.documentElement.classList.add('oled-mode');
        document.body.style.backgroundColor = '#000000';
      }
    } else {
      // No stored setting, apply default (OLED on)
      document.documentElement.classList.add('oled-mode');
      document.body.style.backgroundColor = '#000000';
    }
  } catch {
    // On error, apply OLED mode as default
    document.documentElement.classList.add('oled-mode');
    document.body.style.backgroundColor = '#000000';
  }
}
