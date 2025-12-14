/**
 * OpenFoodFactsSearch - Search products from OpenFoodFacts database
 */

import React, { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { openFoodFactsService } from '@/services/openfoodfacts.service';
import { useModalState } from '@/contexts/ModalStateContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export function OpenFoodFactsSearch({ isOpen, onClose, onSelectProduct }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Register modal state to prevent auto-sync from clearing search results
  const { registerDirtyModal, unregisterDirtyModal } = useModalState();

  useEffect(() => {
    if (isOpen && (searchResults.length > 0 || isSearching)) {
      // Register modal when there are search results or actively searching
      registerDirtyModal('openfoodfacts-search');
    } else {
      // Unregister when closed or no results
      unregisterDirtyModal('openfoodfacts-search');
    }

    return () => {
      unregisterDirtyModal('openfoodfacts-search');
    };
  }, [isOpen, searchResults.length, isSearching, registerDirtyModal, unregisterDirtyModal]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const results = await openFoodFactsService.searchProducts(searchQuery, 20);

      if (results.length === 0) {
        setError('Geen producten gevonden. Probeer een andere zoekterm of gebruik de barcode scanner.');
      }

      // Update source to 'search' instead of 'barcode'
      const searchResults = results.map(p => ({
        ...p,
        source: 'search' as const,
      }));

      setSearchResults(searchResults);
    } catch (err: any) {
      console.error('Search error:', err);

      // Detect CORS error
      if (err.message && err.message.includes('NetworkError')) {
        setError('⚠️ Browser blokkering: Firefox blokkeert OpenFoodFacts zoeken. Gebruik de barcode scanner of probeer Chrome/Edge.');
      } else {
        setError('Zoeken mislukt. Probeer opnieuw of gebruik de barcode scanner.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">OpenFoodFacts Zoeken</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Browser compatibility warning */}
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-400">
            ℹ️ <strong>Let op:</strong> Zoeken werkt mogelijk niet in Firefox vanwege API beperkingen.
            Barcode scannen werkt wel in alle browsers!
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Zoek product op naam..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              autoFocus
              disabled={isSearching}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Zoeken...
                </span>
              ) : (
                <>🔍 Zoek</>
              )}
            </button>
          </div>

          {isSearching && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-spin">⏳</span>
                <div>
                  <div className="font-semibold text-blue-900 dark:text-blue-300">Zoeken in OpenFoodFacts...</div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">Dit kan enkele seconden duren</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="overflow-y-auto max-h-[60vh]">
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((product, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-700"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div className="flex gap-3">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-contain rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">{product.name}</div>
                        {product.brand && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{product.brand}</div>
                        )}
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {product.calories} kcal • {product.protein}g eiw • {product.fat}g vet •{' '}
                          {product.saturatedFat}g v.vet • {product.fiber}g vez •{' '}
                          {product.sodium}mg natr
                        </div>
                        {product.nutri_score && (
                          <div className="mt-1">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                product.nutri_score === 'A'
                                  ? 'bg-green-500 text-white'
                                  : product.nutri_score === 'B'
                                  ? 'bg-green-300 text-gray-800'
                                  : product.nutri_score === 'C'
                                  ? 'bg-yellow-300 text-gray-800'
                                  : product.nutri_score === 'D'
                                  ? 'bg-orange-400 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              Nutri-Score: {product.nutri_score}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-2xl">➕</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && searchResults.length === 0 && searchQuery && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Voer een zoekopdracht in en klik op Zoek
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
