/**
 * theme_global_state_store.tsx
 * Global theme state management using Zustand
 * Controls dark/light theme switching with localStorage persistence
 */
import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem('alphahub-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage may be unavailable in some environments
  }
  return 'dark';
};

// Apply initial theme class to <html> immediately on module load
const initialTheme = getStoredTheme();
document.documentElement.classList.toggle('light', initialTheme === 'light');

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('alphahub-theme', next);
      } catch {
        // ignore if localStorage unavailable
      }
      document.documentElement.classList.toggle('light', next === 'light');
      return { theme: next };
    }),
}));
