import { useState } from 'react';
import { ImportExportTab } from './ImportExportTab';
import { ProductsPortionsTab } from './ProductsPortionsTab';
import { TemplatesTab } from './TemplatesTab';

type DataTab = 'products' | 'templates' | 'import-export';

export function DataPage() {
  const [activeTab, setActiveTab] = useState<DataTab>('products');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data</h1>
        <p className="text-gray-600 mt-2">Beheer je producten, templates en data transport</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="sm:hidden">🍽️ Producten</span>
              <span className="hidden sm:inline">🍽️ Producten & Porties</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Templates
            </button>
            <button
              onClick={() => setActiveTab('import-export')}
              className={`px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'import-export'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="sm:hidden">💾 Import</span>
              <span className="hidden sm:inline">💾 Import/Export</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'products' && <ProductsPortionsTab />}
          {activeTab === 'templates' && <TemplatesTab />}
          {activeTab === 'import-export' && <ImportExportTab />}
        </div>
      </div>
    </div>
  );
}
