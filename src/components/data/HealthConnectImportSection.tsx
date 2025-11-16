import { useState } from 'react';
import { healthConnectImportService, type ParsedHealthConnectData } from '@/services/health-connect-import.service';
import { activitiesService } from '@/services/activities.service';
import { weightsService } from '@/services/weights.service';
import { heartRateSamplesService } from '@/services/heart-rate-samples.service';

export function HealthConnectImportSection() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedHealthConnectData[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setParsedData([]);
      setImportSuccess(false);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Selecteer eerst een database bestand');
      return;
    }

    setParsing(true);
    setError('');
    setParsedData([]);

    try {
      const results = await healthConnectImportService.parseDatabase(file);

      if (results.length === 0) {
        setError('Geen activiteit data gevonden in de database');
        return;
      }

      setParsedData(results);

      // Preview body composition data (don't import yet, just show in console)
      try {
        const bodyCompData = await healthConnectImportService.extractFitDaysBodyComposition();
        console.log(`📊 Preview: Found ${bodyCompData.length} weight measurements with body composition`);
        bodyCompData.forEach(w => {
          console.log(`  ${w.date}: ${w.weight}kg, BF: ${w.bodyFat}%, Bone: ${w.boneMass}kg, BMR: ${w.bmr}kcal`);
        });
      } catch (err) {
        console.warn('Could not preview body composition:', err);
      }
    } catch (err: any) {
      setError(err?.message || 'Fout bij het parsen van de database');
      console.error('Health Connect parse error:', err);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError('Geen data om te importeren');
      return;
    }

    setImporting(true);
    setError('');

    try {
      // 1. Import Activities
      const activities = healthConnectImportService.convertToActivities(parsedData);

      let imported = 0;
      let skipped = 0;

      for (const activity of activities) {
        try {
          // Check if activity already exists
          const existing = await activitiesService.getActivityByDate(activity.date);

          if (existing) {
            // Merge with existing data
            // Only overwrite if the new value is defined and not 0 (except for intensityMinutes where 0 is valid)
            const merged = {
              ...existing,
              totalCalories: activity.totalCalories || existing.totalCalories,
              activeCalories: activity.activeCalories || existing.activeCalories,
              restingCalories: activity.restingCalories || existing.restingCalories,
              steps: activity.steps || existing.steps,
              intensityMinutes: activity.intensityMinutes !== undefined ? activity.intensityMinutes : existing.intensityMinutes,
              distanceMeters: activity.distanceMeters || existing.distanceMeters,
              floorsClimbed: activity.floorsClimbed || existing.floorsClimbed,
              heartRateResting: activity.heartRateResting || existing.heartRateResting,
              heartRateMax: activity.heartRateMax || existing.heartRateMax,
              stressLevel: activity.stressLevel || existing.stressLevel,
              bodyBattery: activity.bodyBattery || existing.bodyBattery,
              sleepSeconds: activity.sleepSeconds || existing.sleepSeconds,
              hrvOvernight: activity.hrvOvernight || existing.hrvOvernight,
              hrv7DayAvg: activity.hrv7DayAvg || existing.hrv7DayAvg,
              activities: existing.activities || []
            };

            await activitiesService.addOrUpdateActivity(merged);
            skipped++;
          } else {
            await activitiesService.addOrUpdateActivity(activity);
            imported++;
          }
        } catch (err) {
          console.error(`Failed to import activity for ${activity.date}:`, err);
        }
      }

      // 2. Import Heart Rate Samples (intraday HR data)
      try {
        await healthConnectImportService.extractAndStoreAllHeartRateSamples();

        // Cleanup old HR samples (75-day retention)
        const deletedDays = await heartRateSamplesService.cleanupOldSamples();
        if (deletedDays > 0) {
          console.log(`🗑️ Cleaned up ${deletedDays} days of old HR samples (75-day retention)`);
        }
      } catch (err) {
        console.error('Failed to import heart rate samples:', err);
      }

      // 3. Import Body Composition (FitDays weight data)
      let weightsImported = 0;
      let weightsUpdated = 0;
      let weightsSkipped = 0;

      try {
        const bodyCompositionData = await healthConnectImportService.extractFitDaysBodyComposition();

        if (bodyCompositionData.length > 0) {
          const weightResult = await weightsService.importFitDaysWeights(bodyCompositionData);
          weightsImported = weightResult.imported;
          weightsUpdated = weightResult.updated;
          weightsSkipped = weightResult.skipped;
        }
      } catch (err) {
        console.error('Failed to import body composition:', err);
      }

      setImportSuccess(true);
      setError('');

      // Show summary
      const summary = [
        `✅ Import succesvol!`,
        ``,
        `📊 Activiteiten:`,
        `  • ${imported} nieuwe dagen toegevoegd`,
        `  • ${skipped} bestaande dagen samengevoegd`,
      ];

      if (weightsImported > 0 || weightsUpdated > 0 || weightsSkipped > 0) {
        summary.push(
          ``,
          `🏋️ Gewicht & Lichaamssamenstelling:`,
          `  • ${weightsImported} nieuwe metingen toegevoegd`,
          `  • ${weightsUpdated} metingen bijgewerkt`,
          `  • ${weightsSkipped} overgeslagen (oudere data)`
        );
      }

      alert(summary.join('\n'));

      // Reset
      setFile(null);
      setParsedData([]);

    } catch (err: any) {
      setError(err?.message || 'Fout bij het importeren');
      console.error('Health Connect import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setError('');
    setImportSuccess(false);
    healthConnectImportService.cleanup();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}u ${minutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Health Connect Import</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Importeer activiteit data uit Android Health Connect database backup
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400">
            ✗ {error}
          </div>
        )}

        {/* Success Message */}
        {importSuccess && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400">
            ✓ Data succesvol geïmporteerd!
          </div>
        )}

        {/* File Upload */}
        {!parsedData.length && (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".db,.sqlite,.sqlite3"
              onChange={handleFileSelect}
              className="hidden"
              id="health-connect-file-input"
              disabled={parsing}
            />
            <label
              htmlFor="health-connect-file-input"
              className="cursor-pointer"
            >
              <div className="text-4xl mb-4">💚</div>
              <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {parsing ? 'Bezig met laden...' : file ? file.name : 'Klik om Health Connect database te selecteren'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ondersteund: .db, .sqlite, .sqlite3 bestanden
              </p>
            </label>

            {file && !parsing && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handlePreview}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Preview Data
                </button>
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto ml-0 sm:ml-2 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Annuleren
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Gevonden data: {parsedData.length} dagen
              </h3>
              <button
                onClick={handleReset}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Opnieuw
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">Periode</div>
                <div className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-300 mt-1">
                  {parsedData.length} dagen
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">Stappen</div>
                <div className="text-base sm:text-lg font-semibold text-green-900 dark:text-green-300 mt-1">
                  {parsedData.filter(d => d.metrics.steps).length} dagen
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium">Slaap</div>
                <div className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-300 mt-1">
                  {parsedData.filter(d => d.metrics.sleepSeconds).length} dagen
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-medium">Hartslag</div>
                <div className="text-base sm:text-lg font-semibold text-orange-900 dark:text-orange-300 mt-1">
                  {parsedData.filter(d => d.metrics.heartRateResting).length} dagen
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                        Datum
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                        Stappen
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                        Calorieën
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                        Afstand
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                        Slaap
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                        Rust HR
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
                        Bron
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {parsedData.map((data) => (
                      <tr key={data.date} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {data.date}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {data.metrics.steps?.toLocaleString() || '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {data.metrics.totalCalories ? `${data.metrics.totalCalories} kcal` : '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {data.metrics.distanceMeters ? `${(data.metrics.distanceMeters / 1000).toFixed(2)} km` : '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {data.metrics.sleepSeconds ? formatDuration(data.metrics.sleepSeconds) : '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {data.metrics.heartRateResting ? `${data.metrics.heartRateResting} bpm` : '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex flex-wrap gap-1">
                            {data.sources.map(source => (
                              <span
                                key={source}
                                className="inline-block px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded"
                              >
                                {source.replace(' Connect', '')}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warnings */}
            {parsedData.some(d => d.warnings.length > 0) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">⚠️ Waarschuwingen</h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
                  {Array.from(new Set(parsedData.flatMap(d => d.warnings))).map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Fields Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">ℹ️ Niet beschikbaar in Health Connect</h4>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                De volgende velden worden niet geïmporteerd omdat ze niet beschikbaar zijn in deze backup:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1">
                <li>• Intensity Minutes (activiteit intensiteit)</li>
                <li>• Stress Level (stressniveau)</li>
                <li>• Body Battery (Garmin-specifiek)</li>
                <li>• HRV (hartslagvariabiliteit)</li>
              </ul>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Deze metrics kun je importeren via Garmin CSV bestanden.
              </p>
            </div>

            {/* Import Button */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Bezig met importeren...' : `Importeer ${parsedData.length} dagen`}
              </button>
              <button
                onClick={handleReset}
                disabled={importing}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">💡 Hoe werkt het?</h3>
          <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-decimal list-inside">
            <li>Exporteer je Health Connect data via Android instellingen (of via backup app)</li>
            <li>Upload het .db bestand hier</li>
            <li>Preview de data om te zien wat er geïmporteerd wordt</li>
            <li>Klik op "Importeer" om de data toe te voegen aan BiteBudget</li>
          </ol>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
            <strong>Ondersteunde apps:</strong> Garmin Connect, FitDays (weegschaal)
          </p>
        </div>
      </div>
    </div>
  );
}
