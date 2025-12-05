/**
 * Settings Store - User preferences
 *
 * Manages visual and behavior settings including OLED mode.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  oledMode: boolean;
  setOledMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      oledMode: true, // Default to OLED mode (true black backgrounds)
      setOledMode: (enabled) => set({ oledMode: enabled }),
    }),
    {
      name: 'spectrascope-settings',
    }
  )
);
