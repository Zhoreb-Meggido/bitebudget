import { useState } from 'react';
import { ImportExportTab } from './ImportExportTab';
import { ProductsPortionsTab } from './ProductsPortionsTab';
import { TemplatesTab } from './TemplatesTab';
import { useSwipeTabs } from '../../hooks';

type DataTab = 'products' | 'templates' | 'import-export';

export function DataPage() {
  const [activeTab, setActiveTab] = useState<DataTab>('products');

  // Enable swipe gestures for tab navigation
  const tabs: DataTab[] = ['products', 'templates', 'import-export'];
  const swipeHandlers = useSwipeTabs({
    tabs,
    activeTab,
    setActiveTab,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Data</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Beheer je producten, templates en data transport</p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="sm:hidden">🍽️ Producten</span>
              <span className="hidden sm:inline">🍽️ Producten & Porties</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              📋 Templates
            </button>
            <button
              onClick={() => setActiveTab('import-export')}
              className={`px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'import-export'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="sm:hidden">💾 Import</span>
              <span className="hidden sm:inline">💾 Import/Export</span>
            </button>
          </nav>
        </div>

        {/* Tab Content - swipe-enabled */}
        <div className="p-4 sm:p-6" {...swipeHandlers}>
          {activeTab === 'products' && <ProductsPortionsTab />}
          {activeTab === 'templates' && <TemplatesTab />}
          {activeTab === 'import-export' && <ImportExportTab />}
        </div>
      </div>
    </div>
  );
}
