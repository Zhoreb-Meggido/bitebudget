import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks';
import type { UserSettings } from '@/types/database.types';

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
        {/* Calorieën Sectie */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Calorieën</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rustdag (kcal)
              </label>
              <input
                type="number"
                value={localSettings.caloriesRest}
                onChange={(e) => handleChange('caloriesRest', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sportdag (kcal)
              </label>
              <input
                type="number"
                value={localSettings.caloriesSport}
                onChange={(e) => handleChange('caloriesSport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Eiwit Sectie */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Eiwit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rustdag (g)
              </label>
              <input
                type="number"
                value={localSettings.proteinRest}
                onChange={(e) => handleChange('proteinRest', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sportdag (g)
              </label>
              <input
                type="number"
                value={localSettings.proteinSport}
                onChange={(e) => handleChange('proteinSport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Overige Nutriënten */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overige Nutriënten</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verzadigd Vet Max (g)
              </label>
              <input
                type="number"
                value={localSettings.saturatedFatMax}
                onChange={(e) => handleChange('saturatedFatMax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vezels Min (g)
              </label>
              <input
                type="number"
                value={localSettings.fiberMin}
                onChange={(e) => handleChange('fiberMin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Natrium Max (mg)
              </label>
              <input
                type="number"
                value={localSettings.sodiumMax}
                onChange={(e) => handleChange('sodiumMax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Gewicht Doel */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Gewicht</h2>
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
        <div className="p-6 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
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
      </div>
    </div>
  );
}
