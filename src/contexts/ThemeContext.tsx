/**
 * ThemeContext - Manages dark/light theme throughout the app
 *
 * Supports:
 * - Light mode
 * - Dark mode
 * - System preference (automatic)
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSettings } from '@/hooks';
import type { ThemeMode } from '@/types';

interface ThemeContextValue {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings, saveSettings } = useSettings();
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Get the user's theme preference from settings
  const theme = settings.theme || 'system';

  // Determine the effective theme (resolve 'system' to actual theme)
  useEffect(() => {
    const getEffectiveTheme = (): 'light' | 'dark' => {
      if (theme === 'system') {
        // Use system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme;
    };

    const updateEffectiveTheme = () => {
      const newTheme = getEffectiveTheme();
      setEffectiveTheme(newTheme);

      // Apply theme to document
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateEffectiveTheme();

    // Listen for system theme changes (only if theme is 'system')
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateEffectiveTheme();

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
      // Legacy browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme]);

  const setTheme = async (newTheme: ThemeMode) => {
    // Update settings directly without awaiting updateSettings
    await saveSettings({ ...settings, theme: newTheme });
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
