import { useState, useRef } from 'react';
import { garminImportService, type ParsedGarminData, type ImportResult } from '@/services/garmin-import.service';

export function GarminImportSection() {
  const [files, setFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedGarminData[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    setError('');
    setImportResult(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const csvFiles = droppedFiles.filter(f => f.name.endsWith('.csv'));

    if (csvFiles.length > 0) {
      setFiles(prev => [...prev, ...csvFiles]);
      setError('');
      setImportResult(null);
    } else {
      setError('Alleen CSV bestanden zijn toegestaan');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePreview = async () => {
    if (files.length === 0) {
      setError('Selecteer eerst bestanden');
      return;
    }

    setParsing(true);
    setError('');

    try {
      const data = await garminImportService.previewImport(files);
      setParsedData(data);

      if (data.length === 0) {
        setError('Geen data gevonden in de geselecteerde bestanden');
      }
    } catch (err) {
      setError(`Fout bij parsen: ${err}`);
      console.error('Parse error:', err);
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
      const result = await garminImportService.importData(parsedData);
      setImportResult(result);

      if (result.success) {
        // Clear files and preview after successful import
        setFiles([]);
        setParsedData([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(`Import gedeeltelijk mislukt: ${result.errors.join(', ')}`);
      }
    } catch (err) {
      setError(`Import mislukt: ${err}`);
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setParsedData([]);
    setImportResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatSleepDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}u ${minutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fitness Data Import (Garmin CSV)</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Importeer je fitness data uit Garmin Connect CSV exports
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Status Messages */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400">
            ✗ {error}
          </div>
        )}

        {importResult && (
          <>
            {importResult.daysImported > 0 && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                ✓ {importResult.daysImported} dagen succesvol geïmporteerd!
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                  ⚠️ {importResult.errors.length} dagen konden niet worden geïmporteerd
                </h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1 max-h-32 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="font-mono text-xs">• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* File Upload Area */}
        {files.length === 0 && (
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="garmin-import-files"
            />
            <label
              htmlFor="garmin-import-files"
              className="cursor-pointer"
            >
              <div className="text-4xl mb-4">📊</div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Sleep CSV bestanden hierheen of klik om te selecteren
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Je kunt meerdere CSV bestanden tegelijk uploaden
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Ondersteund: Calories, Steps, Stress, Intensity Minutes, Resting Heart Rate, HRV Status, Sleep (inclusief Body Battery)
              </p>
            </label>
          </div>
        )}

        {/* Selected Files */}
        {files.length > 0 && parsedData.length === 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Geselecteerde bestanden ({files.length})</h3>
              <button
                onClick={handleReset}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Annuleren
              </button>
            </div>

            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="text-2xl">📄</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handlePreview}
              disabled={parsing}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {parsing ? 'Bezig met parsen...' : `Preview Data (${files.length} bestanden)`}
            </button>
          </div>
        )}

        {/* Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Preview ({parsedData.length} dagen)</h3>
              <button
                onClick={handleReset}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Annuleren
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Datum</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cal</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stappen</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Int.min</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">HR rust</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">HR max</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Slaap</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Body Batt</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">HRV</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">HRV 7d</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stress</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {parsedData.slice(0, 50).map((day, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">{day.date}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{day.calories?.total || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{day.steps || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{day.intensityMinutes || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{day.heartRate?.resting || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{day.heartRate?.max || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{formatSleepDuration(day.sleepSeconds)}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{day.bodyBattery || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{day.hrvOvernight || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{day.hrv7DayAvg || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{day.stress || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 50 && (
                <div className="p-2 bg-gray-50 dark:bg-gray-900 text-center text-sm text-gray-600 dark:text-gray-400">
                  ... en nog {parsedData.length - 50} dagen
                </div>
              )}
            </div>

            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Bezig met importeren...' : `Importeer ${parsedData.length} dagen`}
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 Tips voor Garmin Export</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Ga naar Garmin Connect website → Performance Stats → Reports</li>
            <li>• Download deze CSV exports (meerdere tegelijk):</li>
            <li className="ml-4">- Calories (kies dagelijks/maandelijks, NIET wekelijks)</li>
            <li className="ml-4">- Steps</li>
            <li className="ml-4">- Resting Heart Rate</li>
            <li className="ml-4">- HRV Status</li>
            <li className="ml-4">- Stress</li>
            <li className="ml-4">- Intensity Minutes</li>
            <li className="ml-4">- Sleep Score (4 weken format bevat ook Body Battery)</li>
            <li>• Upload alle bestanden tegelijk - data wordt samengevoegd per datum</li>
            <li className="mt-2">• <strong>Geen CSV export knop?</strong> Selecteer data op de Garmin site, kopieer (Ctrl+C), plak in een .txt bestand en hernoem naar .csv</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
