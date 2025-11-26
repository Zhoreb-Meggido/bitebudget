import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import type { UserSettings, ThemeMode } from '@/types/database.types';
import { CloudSyncSettings } from './CloudSyncSettings';

export function SettingsPage() {
  const { settings, updateSettings, saveSettings, resetSettings, reloadSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync local state when settings change
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const handleChange = (field: keyof UserSettings, value: string | number | boolean) => {
    // Handle boolean directly
    if (typeof value === 'boolean') {
      setLocalSettings(prev => ({
        ...prev,
        [field]: value,
      }));
      setHasChanges(true);
      return;
    }

    // Handle string time values (HH:mm)
    if (typeof value === 'string' && value.includes(':')) {
      setLocalSettings(prev => ({
        ...prev,
        [field]: value,
      }));
      setHasChanges(true);
      return;
    }

    // Handle numeric values
    const numValue = parseFloat(value as string);
    if (isNaN(numValue)) return;

    setLocalSettings(prev => ({
      ...prev,
      [field]: numValue,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await saveSettings(localSettings);
      setSaveStatus('saved');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = async () => {
    if (!confirm('Weet je zeker dat je alle instellingen wilt resetten naar standaardwaarden?')) {
      return;
    }
    try {
      await resetSettings();
      await reloadSettings();
      setHasChanges(false);
      setSaveStatus('idle');
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    setSaveStatus('idle');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Instellingen</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Pas je dagelijkse doelen en limieten aan</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Weergave */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Weergave</h2>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thema
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeMode)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Licht</option>
              <option value="dark">Donker</option>
              <option value="system">Systeem</option>
            </select>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Systeem volgt automatisch de voorkeuren van je apparaat
            </p>
          </div>
        </div>

        {/* Dagelijkse Doelen */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Dagelijkse Doelen</h2>

          {/* All 8 settings in one grid: 4 rows x 2 cols on mobile, 2 rows x 4 cols on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Calorieën (kcal)</label>
              <input
                type="number"
                inputMode="decimal"
                value={localSettings.calories}
                onChange={(e) => handleChange('calories', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Eiwit (g) min</label>
              <input
                type="number"
                inputMode="decimal"
                value={localSettings.protein}
                onChange={(e) => handleChange('protein', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Koolhydraten (g)</label>
              <input
                type="number"
                value={localSettings.carbohydratesMax}
                onChange={(e) => handleChange('carbohydratesMax', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Suikers (g)</label>
              <input
                type="number"
                value={localSettings.sugarsMax}
                onChange={(e) => handleChange('sugarsMax', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Vet (g)</label>
              <input
                type="number"
                value={localSettings.fatMax}
                onChange={(e) => handleChange('fatMax', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Verzadigd Vet (g)</label>
              <input
                type="number"
                value={localSettings.saturatedFatMax}
                onChange={(e) => handleChange('saturatedFatMax', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Vezels (g) min</label>
              <input
                type="number"
                value={localSettings.fiberMin}
                onChange={(e) => handleChange('fiberMin', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Natrium (mg)</label>
              <input
                type="number"
                value={localSettings.sodiumMax}
                onChange={(e) => handleChange('sodiumMax', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Gewicht Doel */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Gewicht</h2>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Streefgewicht (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={localSettings.targetWeight}
              onChange={(e) => handleChange('targetWeight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Water Intake */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">💧 Water Intake</h2>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dagelijks doel (ml)
            </label>
            <input
              type="number"
              step="100"
              value={localSettings.waterGoalMl}
              onChange={(e) => handleChange('waterGoalMl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Aanbevolen: 2000ml (8 glazen)
            </p>
          </div>
        </div>

        {/* Intermittent Fasting */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">⏰ Intermittent Fasting</h2>

          {/* Toggle */}
          <div className="mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.intermittentFasting || false}
                onChange={(e) => handleChange('intermittentFasting', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                IF tracking inschakelen
              </span>
            </label>
            <p className="mt-2 ml-8 text-xs text-gray-500 dark:text-gray-400">
              Visualiseer of maaltijden binnen je eating window vallen
            </p>
          </div>

          {/* Time pickers (only shown when IF is enabled) */}
          {localSettings.intermittentFasting && (
            <div className="ml-8 space-y-3">
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Window start
                  </label>
                  <input
                    type="time"
                    value={localSettings.ifWindowStart || '12:00'}
                    onChange={(e) => handleChange('ifWindowStart', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Window eind
                  </label>
                  <input
                    type="time"
                    value={localSettings.ifWindowEnd || '20:00'}
                    onChange={(e) => handleChange('ifWindowEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Window duration preview */}
              {localSettings.ifWindowStart && localSettings.ifWindowEnd && (() => {
                const [startHour, startMin] = localSettings.ifWindowStart.split(':').map(Number);
                const [endHour, endMin] = localSettings.ifWindowEnd.split(':').map(Number);
                let durationHours = endHour - startHour;
                let durationMins = endMin - startMin;
                if (durationMins < 0) {
                  durationHours -= 1;
                  durationMins += 60;
                }
                if (durationHours < 0) durationHours += 24; // Handle overnight window

                return (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Eating window:</span> {localSettings.ifWindowStart} - {localSettings.ifWindowEnd}
                      {' '}({durationHours}u {durationMins > 0 ? `${durationMins}m` : ''})
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Maaltijden binnen dit window krijgen een groene border, maaltijden erbuiten een oranje border.
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleSave}
                disabled={!hasChanges || saveStatus === 'saving'}
                className={`
                  px-4 py-2 rounded-md font-medium transition-colors
                  ${hasChanges && saveStatus !== 'saving'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {saveStatus === 'saving' ? 'Opslaan...' : 'Opslaan'}
              </button>

              {hasChanges && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Annuleren
                </button>
              )}

              {saveStatus === 'saved' && (
                <span className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                  ✓ Opgeslagen
                </span>
              )}

              {saveStatus === 'error' && (
                <span className="flex items-center text-red-600 dark:text-red-400 text-sm font-medium">
                  ✗ Fout bij opslaan
                </span>
              )}
            </div>

            <button
              onClick={handleReset}
              className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
            >
              Reset naar Standaard
            </button>
          </div>
        </div>

        {/* Cloud Sync */}
        <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-800 rounded-b-lg">
          <CloudSyncSettings />
        </div>
      </div>
    </div>
  );
}
