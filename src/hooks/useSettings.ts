/**
 * useSettings Hook
 *
 * React hook voor het beheren van gebruikersinstellingen
 */

import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '@/services/settings.service';
import type { UserSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Laad settings bij mount
  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const loadedSettings = await settingsService.loadSettings();
        if (mounted) {
          setSettings(loadedSettings);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('❌ Failed to load settings:', err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await settingsService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('❌ Failed to update settings:', err);
      setError(err as Error);
      throw err;
    }
  }, [settings]);

  // Save settings (complete object)
  const saveSettings = useCallback(async (newSettings: UserSettings) => {
    try {
      await settingsService.saveSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      console.error('❌ Failed to save settings:', err);
      setError(err as Error);
      throw err;
    }
  }, []);

  // Reset naar defaults
  const resetSettings = useCallback(async () => {
    try {
      await settingsService.resetSettings();
      setSettings(DEFAULT_SETTINGS);
    } catch (err) {
      console.error('❌ Failed to reset settings:', err);
      setError(err as Error);
      throw err;
    }
  }, []);

  // Reload settings (bijv. na import)
  const reloadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedSettings = await settingsService.loadSettings();
      setSettings(loadedSettings);
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Failed to reload settings:', err);
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    saveSettings,
    resetSettings,
    reloadSettings,
  };
}

export default useSettings;
