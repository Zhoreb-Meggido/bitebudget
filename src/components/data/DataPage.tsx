import { useState } from 'react';
import { useEntries, useProducts, useWeights, useSettings } from '@/hooks';
import { entriesService } from '@/services/entries.service';
import { productsService } from '@/services/products.service';
import { weightsService } from '@/services/weights.service';
import { settingsService } from '@/services/settings.service';
import { downloadTextFile } from '@/utils/download.utils';
import { generateTxtReport, generatePdfReport, type ReportOptions } from '@/utils/report.utils';
import type { Entry, Product, Weight, UserSettings } from '@/types';

interface BackupData {
  version: string;
  exportDate: string;
  entries?: Entry[];
  products?: Product[];
  weights?: Weight[];
  settings?: UserSettings;
}

export function DataPage() {
  const { entries, reloadEntries } = useEntries();
  const { products, reloadProducts } = useProducts();
  const { weights, reloadWeights } = useWeights();
  const { settings, reloadSettings } = useSettings();

  const [importing, setImporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string>('');

  type TimeRange = '7' | '14' | '30' | '90' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'all' | 'custom';
  const [timeRange, setTimeRange] = useState<TimeRange>('14');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate date range for reports
  const getDateRangeForReport = (): ReportOptions => {
    const today = new Date();

    switch (timeRange) {
      case '7':
        return { days: 7 };
      case '14':
        return { days: 14 };
      case '30':
        return { days: 30 };
      case '90':
        return { days: 90 };
      case 'this-week': {
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        return { startDate: monday.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
      }
      case 'last-week': {
        const dayOfWeek = today.getDay();
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        return { startDate: lastMonday.toISOString().split('T')[0], endDate: lastSunday.toISOString().split('T')[0] };
      }
      case 'this-month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: firstDay.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
      }
      case 'last-month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        return { startDate: firstDay.toISOString().split('T')[0], endDate: lastDay.toISOString().split('T')[0] };
      }
      case 'all':
        return { days: 0 }; // 0 means all data
      case 'custom':
        return { startDate: customStartDate, endDate: customEndDate };
      default:
        return { days: 14 };
    }
  };

  // Export all data
  const handleExportAll = () => {
    const backup: BackupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries,
      products,
      weights,
      settings,
    };

    const json = JSON.stringify(backup, null, 2);
    const filename = `voedseljournaal-backup-${new Date().toISOString().split('T')[0]}.json`;
    downloadTextFile(json, filename);
    setExportStatus('✓ Volledige backup geëxporteerd');
    setTimeout(() => setExportStatus(''), 3000);
  };

  // Export entries only
  const handleExportEntries = () => {
    const backup: BackupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries,
    };

    const json = JSON.stringify(backup, null, 2);
    const filename = `voedseljournaal-entries-${new Date().toISOString().split('T')[0]}.json`;
    downloadTextFile(json, filename);
    setExportStatus('✓ Maaltijden geëxporteerd');
    setTimeout(() => setExportStatus(''), 3000);
  };

  // Export products only
  const handleExportProducts = () => {
    const backup: BackupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      products,
    };

    const json = JSON.stringify(backup, null, 2);
    const filename = `voedseljournaal-products-${new Date().toISOString().split('T')[0]}.json`;
    downloadTextFile(json, filename);
    setExportStatus('✓ Producten geëxporteerd');
    setTimeout(() => setExportStatus(''), 3000);
  };

  // Export weights only
  const handleExportWeights = () => {
    const backup: BackupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      weights,
    };

    const json = JSON.stringify(backup, null, 2);
    const filename = `voedseljournaal-weights-${new Date().toISOString().split('T')[0]}.json`;
    downloadTextFile(json, filename);
    setExportStatus('✓ Gewichten geëxporteerd');
    setTimeout(() => setExportStatus(''), 3000);
  };

  // Import data
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus('Bezig met importeren...');

    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);

      let imported = {
        entries: { added: 0, total: 0 },
        products: { added: 0, updated: 0, total: 0 },
        weights: { added: 0, total: 0 },
        settings: false,
      };

      // Import entries
      if (data.entries && data.entries.length > 0) {
        const addedEntries = await entriesService.bulkAddEntries(data.entries);
        imported.entries = { added: addedEntries, total: data.entries.length };
      }

      // Import products (with smart merge)
      if (data.products && data.products.length > 0) {
        const result = await productsService.mergeProducts(data.products);
        imported.products = {
          added: result.added,
          updated: result.updated,
          total: data.products.length
        };
      }

      // Import weights
      if (data.weights && data.weights.length > 0) {
        const addedWeights = await weightsService.importWeights(data.weights);
        imported.weights = { added: addedWeights, total: data.weights.length };
      }

      // Import settings
      if (data.settings) {
        await settingsService.saveSettings(data.settings);
        imported.settings = true;
      }

      // Reload all data
      await Promise.all([
        reloadEntries(),
        reloadProducts(),
        reloadWeights(),
        reloadSettings(),
      ]);

      const summary = [
        imported.entries.total > 0 ? `${imported.entries.added} van ${imported.entries.total} maaltijden` : null,
        imported.products.total > 0 ? `${imported.products.added} nieuw, ${imported.products.updated} geüpdatet van ${imported.products.total} producten` : null,
        imported.weights.total > 0 ? `${imported.weights.added} van ${imported.weights.total} gewichten` : null,
        imported.settings ? 'instellingen' : null,
      ].filter(Boolean).join(', ');

      setImportStatus(`✓ Geïmporteerd: ${summary}`);
      setTimeout(() => setImportStatus(''), 5000);
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('✗ Import mislukt - controleer het bestand');
      setTimeout(() => setImportStatus(''), 5000);
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Delete all data
  const handleDeleteAll = async () => {
    const confirmed = confirm(
      'WAARSCHUWING: Dit verwijdert ALLE data (maaltijden, producten, gewichten).\n\n' +
      'Maak eerst een backup als je je data wilt behouden.\n\n' +
      'Weet je zeker dat je door wilt gaan?'
    );

    if (!confirmed) return;

    const doubleCheck = confirm(
      'Laatste bevestiging: Dit kan NIET ongedaan worden gemaakt.\n\n' +
      'Alle data wordt permanent verwijderd.'
    );

    if (!doubleCheck) return;

    try {
      await Promise.all([
        entriesService.clearAllEntries(),
        productsService.clearAllProducts(),
        weightsService.deleteAllWeights(),
      ]);

      await Promise.all([
        reloadEntries(),
        reloadProducts(),
        reloadWeights(),
      ]);

      alert('Alle data is verwijderd');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Fout bij verwijderen van data');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data</h1>
        <p className="text-gray-600 mt-2">Exporteer en importeer je voedingsjournaal data</p>
      </div>

      {/* Status Messages */}
      {(exportStatus || importStatus) && (
        <div className={`mb-6 p-4 rounded-lg ${
          exportStatus.startsWith('✓') || importStatus.startsWith('✓')
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
        }`}>
          {exportStatus || importStatus}
        </div>
      )}

      {/* Report Generation Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Rapportage</h2>
          <p className="text-sm text-gray-600 mt-1">Genereer overzichtsrapporten van je journaal</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Time Range Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tijdsvak
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Laatste 7 dagen</option>
              <option value="14">Laatste 14 dagen</option>
              <option value="30">Laatste 30 dagen</option>
              <option value="90">Laatste 90 dagen</option>
              <option value="this-week">Deze week</option>
              <option value="last-week">Vorige week</option>
              <option value="this-month">Deze maand</option>
              <option value="last-month">Vorige maand</option>
              <option value="all">Alles</option>
              <option value="custom">Aangepast</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {timeRange === 'custom' && (
            <div className="flex flex-col md:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Van
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tot
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Download Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => generateTxtReport(entries, getDateRangeForReport())}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              💾 Download TXT
            </button>
            <button
              onClick={() => generatePdfReport(entries, getDateRangeForReport())}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
            >
              📄 Download PDF
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Genereer een overzicht van je voedingsjournaal met dagelijkse entries en gemiddelden
          </p>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Exporteren</h2>
          <p className="text-sm text-gray-600 mt-1">Download je data als JSON bestand</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">Volledige Backup</h3>
              <p className="text-sm text-gray-600">
                Alle data: {entries.length} maaltijden, {products.length} producten, {weights.length} gewichten, instellingen
              </p>
            </div>
            <button
              onClick={handleExportAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Exporteer Alles
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">Maaltijden</h3>
              <p className="text-sm text-gray-600">{entries.length} maaltijden</p>
            </div>
            <button
              onClick={handleExportEntries}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Exporteer
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">Producten Database</h3>
              <p className="text-sm text-gray-600">{products.length} producten</p>
            </div>
            <button
              onClick={handleExportProducts}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Exporteer
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">Gewichten</h3>
              <p className="text-sm text-gray-600">{weights.length} metingen</p>
            </div>
            <button
              onClick={handleExportWeights}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Exporteer
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Importeren</h2>
          <p className="text-sm text-gray-600 mt-1">Upload een eerder geëxporteerd JSON bestand</p>
        </div>

        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className={`cursor-pointer ${importing ? 'opacity-50' : ''}`}
            >
              <div className="text-4xl mb-4">📁</div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {importing ? 'Bezig met importeren...' : 'Klik om bestand te selecteren'}
              </p>
              <p className="text-sm text-gray-600">
                JSON bestanden van vorige exports worden automatisch herkend
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Producten worden slim samengevoegd (duplicaten worden bijgewerkt)
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow border-2 border-red-200">
        <div className="p-6 border-b border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
          <p className="text-sm text-red-700 mt-1">Onomkeerbare acties - wees voorzichtig!</p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between p-4 border border-red-300 rounded-lg bg-red-50">
            <div>
              <h3 className="font-medium text-red-900">Alle Data Verwijderen</h3>
              <p className="text-sm text-red-700">
                Verwijdert ALLE maaltijden, producten en gewichten permanent
              </p>
            </div>
            <button
              onClick={handleDeleteAll}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
            >
              Alles Verwijderen
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Maak regelmatig een volledige backup van je data</li>
          <li>• JSON bestanden kunnen worden geopend en bewerkt in een teksteditor</li>
          <li>• Bij import worden producten met dezelfde naam automatisch bijgewerkt</li>
          <li>• Oude app data kan hier geïmporteerd worden als het het juiste formaat heeft</li>
        </ul>
      </div>
    </div>
  );
}
