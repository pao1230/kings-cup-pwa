import { create } from 'zustand';
import type { AppSettings } from '../types';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../lib/storage';

interface SettingsState extends AppSettings {
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  replaceAll: (settings: AppSettings) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  ...loadSettings(),

  set: (key, value) =>
    set((state) => {
      const next = { ...state, [key]: value };
      saveSettings(pick(next));
      applyThemeAndLang(pick(next));
      return next as SettingsState;
    }),

  replaceAll: (settings) =>
    set(() => {
      saveSettings(settings);
      applyThemeAndLang(settings);
      return { ...settings } as SettingsState;
    }),
}));

function pick(s: SettingsState | AppSettings): AppSettings {
  return {
    language: s.language,
    theme: s.theme,
    soundEnabled: s.soundEnabled,
    animationEnabled: s.animationEnabled,
    hapticEnabled: s.hapticEnabled,
    alcoholFreeMode: s.alcoholFreeMode,
  };
}

// Apply theme (light/dark/system) and language to <html> (FR-4.1 / FR-4.2).
export function applyThemeAndLang(settings: AppSettings = DEFAULT_SETTINGS): void {
  const root = document.documentElement;
  const prefersDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', prefersDark);
  root.setAttribute('lang', settings.language);

  const themeColor = prefersDark ? '#0f0a1e' : '#7c3aed';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', themeColor);
}

// Re-evaluate on OS theme change when in "system" mode.
if (typeof window !== 'undefined' && window.matchMedia) {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const s = useSettings.getState();
      if (s.theme === 'system') applyThemeAndLang(pick(s));
    });
}
