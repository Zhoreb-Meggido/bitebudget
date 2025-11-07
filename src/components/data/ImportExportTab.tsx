import { useState } from 'react';
import { useEntries, useProducts, useWeights, useSettings, usePortions, useTemplates } from '@/hooks';
import { entriesService } from '@/services/entries.service';
import { productsService } from '@/services/products.service';
import { weightsService } from '@/services/weights.service';
import { settingsService } from '@/services/settings.service';
import { portionsService } from '@/services/portions.service';
import { templatesService } from '@/services/templates.service';
import { downloadTextFile } from '@/utils/download.utils';
import type { Entry, Product, Weight, UserSettings, ProductPortion, MealTemplate } from '@/types';

interface BackupData {
  version: string;
  exportDate: string;
  entries?: Entry[];
  products?: Product[];
  weights?: Weight[];
  settings?: UserSettings;
  productPortions?: ProductPortion[];
  mealTemplates?: MealTemplate[];
}

export function ImportExportTab() {
  const { entries, reloadEntries } = useEntries();
  const { products, reloadProducts } = useProducts();
  const { weights, reloadWeights } = useWeights();
  const { settings, reloadSettings } = useSettings();
  const { portions, reloadPortions } = usePortions();
  const { templates, reloadTemplates } = useTemplates();

  const [importing, setImporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string>('');

  // Export all data
  const handleExportAll = () => {
    const backup: BackupData = {
      version: '1.3',
      exportDate: new Date().toISOString(),
      entries,
      products,
      weights,
      settings,
      productPortions: portions,
      mealTemplates: templates,
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

  const handleExportPortions = () => {
    const backup: BackupData = {
      version: '1.3',
      exportDate: new Date().toISOString(),
      productPortions: portions,
    };

    const json = JSON.stringify(backup, null, 2);
    const filename = `voedseljournaal-portions-${new Date().toISOString().split('T')[0]}.json`;
    downloadTextFile(json, filename);
    setExportStatus('✓ Porties geëxporteerd');
    setTimeout(() => setExportStatus(''), 3000);
  };

  const handleExportTemplates = () => {
    const backup: BackupData = {
      version: '1.3',
      exportDate: new Date().toISOString(),
      mealTemplates: templates,
    };

    const json = JSON.stringify(backup, null, 2);
    const filename = `voedseljournaal-templates-${new Date().toISOString().split('T')[0]}.json`;
    downloadTextFile(json, filename);
    setExportStatus('✓ Templates geëxporteerd');
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

      // Import portions (v1.3+)
      if (data.productPortions && data.productPortions.length > 0) {
        for (const portion of data.productPortions) {
          try {
            await portionsService.addPortion(portion);
          } catch (err) {
            console.warn('Failed to import portion:', portion.productName, err);
          }
        }
        console.log(`✅ Imported ${data.productPortions.length} portions`);
      }

      // Import templates (v1.3+)
      if (data.mealTemplates && data.mealTemplates.length > 0) {
        for (const template of data.mealTemplates) {
          try {
            await templatesService.addTemplate(template);
          } catch (err) {
            console.warn('Failed to import template:', template.name, err);
          }
        }
        console.log(`✅ Imported ${data.mealTemplates.length} templates`);
      }

      // Reload all data
      await Promise.all([
        reloadEntries(),
        reloadProducts(),
        reloadWeights(),
        reloadSettings(),
        reloadPortions(),
        reloadTemplates(),
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
      const [entriesCount, productsCount, weightsCount, portionsCount, templatesCount] = await Promise.all([
        entriesService.clearAllEntries(),
        productsService.clearAllProducts(),
        weightsService.deleteAllWeights(),
        portionsService.clearAllPortions(),
        templatesService.clearAllTemplates(),
      ]);

      await Promise.all([
        reloadEntries(),
        reloadProducts(),
        reloadWeights(),
      ]);

      alert(`Alle data is verwijderd:\n- ${entriesCount} entries\n- ${productsCount} producten\n- ${weightsCount} gewichten\n- ${portionsCount} porties\n- ${templatesCount} templates`);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Fout bij verwijderen van data');
    }
  };

  return (
    <div className="space-y-6">

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

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Exporteren</h2>
          <p className="text-sm text-gray-600 mt-1">Download je data als JSON bestand</p>
        </div>

        <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="min-w-0 flex-1 mr-3">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Volledige Backup</h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {entries.length} maaltijden, {products.length} producten, {weights.length} gewichten, {portions.length} porties, {templates.length} templates
              </p>
            </div>
            <button
              onClick={handleExportAll}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm whitespace-nowrap flex-shrink-0"
            >
              Exporteer
            </button>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="min-w-0 flex-1 mr-3">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Maaltijden</h3>
              <p className="text-xs sm:text-sm text-gray-600">{entries.length} maaltijden</p>
            </div>
            <button
              onClick={handleExportEntries}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium text-sm whitespace-nowrap flex-shrink-0"
            >
              Exporteer
            </button>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="min-w-0 flex-1 mr-3">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Producten Database</h3>
              <p className="text-xs sm:text-sm text-gray-600">{products.length} producten</p>
            </div>
            <button
              onClick={handleExportProducts}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium text-sm whitespace-nowrap flex-shrink-0"
            >
              Exporteer
            </button>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="min-w-0 flex-1 mr-3">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Gewichten</h3>
              <p className="text-xs sm:text-sm text-gray-600">{weights.length} metingen</p>
            </div>
            <button
              onClick={handleExportWeights}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium text-sm whitespace-nowrap flex-shrink-0"
            >
              Exporteer
            </button>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="min-w-0 flex-1 mr-3">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Porties</h3>
              <p className="text-xs sm:text-sm text-gray-600">{portions.length} porties</p>
            </div>
            <button
              onClick={handleExportPortions}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium text-sm whitespace-nowrap flex-shrink-0"
            >
              Exporteer
            </button>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="min-w-0 flex-1 mr-3">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Templates</h3>
              <p className="text-xs sm:text-sm text-gray-600">{templates.length} templates</p>
            </div>
            <button
              onClick={handleExportTemplates}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium text-sm whitespace-nowrap flex-shrink-0"
            >
              Exporteer
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Importeren</h2>
          <p className="text-sm text-gray-600 mt-1">Upload een eerder geëxporteerd JSON bestand</p>
        </div>

        <div className="p-4 sm:p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-blue-400 transition-colors">
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
        <div className="p-4 sm:p-6 border-b border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
          <p className="text-sm text-red-700 mt-1">Onomkeerbare acties - wees voorzichtig!</p>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between p-3 sm:p-4 border border-red-300 rounded-lg bg-red-50">
            <div className="min-w-0 flex-1 mr-3">
              <h3 className="font-medium text-red-900 text-sm sm:text-base">Alle Data Verwijderen</h3>
              <p className="text-xs sm:text-sm text-red-700">
                Verwijdert ALLE maaltijden, producten en gewichten permanent
              </p>
            </div>
            <button
              onClick={handleDeleteAll}
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-sm whitespace-nowrap flex-shrink-0"
            >
              Verwijderen
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
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
