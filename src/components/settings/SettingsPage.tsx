import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks';
import type { UserSettings } from '@/types/database.types';
import { CloudSyncSettings } from './CloudSyncSettings';

export function SettingsPage() {
  const { settings, updateSettings, saveSettings, resetSettings, reloadSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync local state when settings change
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const handleChange = (field: keyof UserSettings, value: string) => {
    const numValue = parseFloat(value);
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
        <h1 className="text-3xl font-bold text-gray-900">Instellingen</h1>
        <p className="text-gray-600 mt-2">Pas je dagelijkse doelen en limieten aan</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Dagelijkse Doelen */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Dagelijkse Doelen</h2>

          {/* Calorieën */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Calorieën (kcal)</label>
            <input
              type="number"
              inputMode="decimal"
              value={localSettings.calories}
              onChange={(e) => handleChange('calories', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Eiwit */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Eiwit minimum (g)</label>
            <input
              type="number"
              inputMode="decimal"
              value={localSettings.protein}
              onChange={(e) => handleChange('protein', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Macros */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Macronutriënten (max)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Koolhydraten (g)</label>
                <input
                  type="number"
                  value={localSettings.carbohydratesMax}
                  onChange={(e) => handleChange('carbohydratesMax', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Suikers (g)</label>
                <input
                  type="number"
                  value={localSettings.sugarsMax}
                  onChange={(e) => handleChange('sugarsMax', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Vet (g)</label>
                <input
                  type="number"
                  value={localSettings.fatMax}
                  onChange={(e) => handleChange('fatMax', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Verzadigd Vet (g)</label>
                <input
                  type="number"
                  value={localSettings.saturatedFatMax}
                  onChange={(e) => handleChange('saturatedFatMax', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Vezels (g) min</label>
                <input
                  type="number"
                  value={localSettings.fiberMin}
                  onChange={(e) => handleChange('fiberMin', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Natrium (mg)</label>
                <input
                  type="number"
                  value={localSettings.sodiumMax}
                  onChange={(e) => handleChange('sodiumMax', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gewicht Doel */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Gewicht</h2>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Streefgewicht (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={localSettings.targetWeight}
              onChange={(e) => handleChange('targetWeight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleSave}
                disabled={!hasChanges || saveStatus === 'saving'}
                className={`
                  px-4 py-2 rounded-md font-medium transition-colors
                  ${hasChanges && saveStatus !== 'saving'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {saveStatus === 'saving' ? 'Opslaan...' : 'Opslaan'}
              </button>

              {hasChanges && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuleren
                </button>
              )}

              {saveStatus === 'saved' && (
                <span className="flex items-center text-green-600 text-sm font-medium">
                  ✓ Opgeslagen
                </span>
              )}

              {saveStatus === 'error' && (
                <span className="flex items-center text-red-600 text-sm font-medium">
                  ✗ Fout bij opslaan
                </span>
              )}
            </div>

            <button
              onClick={handleReset}
              className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
            >
              Reset naar Standaard
            </button>
          </div>
        </div>

        {/* Cloud Sync */}
        <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white rounded-b-lg">
          <CloudSyncSettings />
        </div>
      </div>
    </div>
  );
}
