import { useState, useMemo, useCallback, memo } from 'react';
import { useProducts, usePortions, useDebounce } from '@/hooks';
import type { Product, ProductPortion } from '@/types';
import { ProductEditModal } from './ProductEditModal';
import { PortionModal } from '@/components/shared/PortionModal';
import { BarcodeScanner } from './BarcodeScanner';
import { OpenFoodFactsSearch } from './OpenFoodFactsSearch';
import { openFoodFactsService } from '@/services/openfoodfacts.service';
import { productsService } from '@/services/products.service';

export function ProductsPortionsTab() {
  const { products, isLoading, addProduct, updateProduct, deleteProduct, reloadProducts } = useProducts();
  const { portions: allPortions, addPortion, updatePortion, deletePortion, setDefaultPortion } = usePortions();

  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyWithPortions, setShowOnlyWithPortions] = useState(false);
  const [sortBy, setSortBy] = useState<'favorite' | 'name-asc' | 'name-desc' | 'calories' | 'protein'>('favorite');

  // Debounce search query to reduce filtering on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Portion modal state
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [editingPortion, setEditingPortion] = useState<ProductPortion | null>(null);
  const [portionProductName, setPortionProductName] = useState('');

  // Barcode and OFF search state
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showOffSearch, setShowOffSearch] = useState(false);
  const [isLoadingFromOff, setIsLoadingFromOff] = useState(false);

  // JSON import state
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  // Handlers (memoized to prevent re-renders of child components)
  const handleAddProduct = useCallback(() => {
    setEditingProduct(null);
    setShowProductModal(true);
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  }, []);

  const handleDeleteProduct = useCallback(async (product: Product) => {
    if (!confirm(`Weet je zeker dat je "${product.name}" wilt verwijderen?`)) {
      return;
    }
    await deleteProduct(product.id!);
  }, [deleteProduct]);

  const handleSaveProduct = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id!, data);
    } else {
      await addProduct(data);
    }
  };

  const handleAddPortion = useCallback((productName: string) => {
    setPortionProductName(productName);
    setEditingPortion(null);
    setShowPortionModal(true);
  }, []);

  const handleEditPortion = useCallback((portion: ProductPortion) => {
    setPortionProductName(portion.productName);
    setEditingPortion(portion);
    setShowPortionModal(true);
  }, []);

  const handleDeletePortion = useCallback(async (portion: ProductPortion) => {
    if (!confirm(`Weet je zeker dat je portie "${portion.portionName}" wilt verwijderen?`)) {
      return;
    }
    await deletePortion(portion.id!);
  }, [deletePortion]);

  const handleSetDefaultPortion = useCallback(async (portion: ProductPortion) => {
    await setDefaultPortion(portion.id!);
  }, [setDefaultPortion]);

  const handleSavePortion = async (data: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingPortion) {
      await updatePortion(editingPortion.id!, data);
    } else {
      await addPortion(data);
    }
  };

  // JSON import handler
  const handleImportJson = async () => {
    try {
      const data = JSON.parse(jsonInput);
      const productsToMerge = Array.isArray(data) ? data : [data];
      const result = await productsService.mergeProducts(productsToMerge);
      alert(`✓ ${result.added} toegevoegd, ${result.updated} bijgewerkt!`);
      await reloadProducts();
      setJsonInput('');
      setShowJsonImport(false);
    } catch (error) {
      console.error('Error importing JSON:', error);
      alert('Ongeldige JSON. Controleer het formaat.');
    }
  };

  // Barcode scan handler
  const handleBarcodeScan = async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    setShowBarcodeScanner(false);
    setIsLoadingFromOff(true);

    try {
      const offProduct = await openFoodFactsService.getProductByBarcode(barcode);

      if (offProduct) {
        // Add product from OpenFoodFacts with all fields
        await addProduct({
          name: offProduct.name,
          calories: offProduct.calories,
          protein: offProduct.protein,
          carbohydrates: offProduct.carbohydrates,
          sugars: offProduct.sugars,
          fat: offProduct.fat,
          saturatedFat: offProduct.saturatedFat,
          fiber: offProduct.fiber,
          sodium: offProduct.sodium,
          favorite: false,
          source: 'barcode',
          ean: offProduct.ean,
          brand: offProduct.brand,
          nutri_score: offProduct.nutri_score,
          image_url: offProduct.image_url,
          openfoodfacts_id: offProduct.openfoodfacts_id,
          last_synced: offProduct.last_synced,
        });
        alert(`✓ Product toegevoegd: ${offProduct.name}`);
      } else {
        alert('❌ Product niet gevonden in OpenFoodFacts database');
      }
    } catch (error: any) {
      console.error('Error fetching product from OFF:', error);
      alert(error.message || 'Fout bij ophalen product. Controleer je internetverbinding.');
    } finally {
      setIsLoadingFromOff(false);
    }
  };

  // OpenFoodFacts search handler
  const handleOffProductSelect = async (offProduct: Product) => {
    setShowOffSearch(false);
    setIsLoadingFromOff(true);

    try {
      // Add product with all OpenFoodFacts fields
      await addProduct({
        name: offProduct.name,
        calories: offProduct.calories,
        protein: offProduct.protein,
        carbohydrates: offProduct.carbohydrates,
        sugars: offProduct.sugars,
        fat: offProduct.fat,
        saturatedFat: offProduct.saturatedFat,
        fiber: offProduct.fiber,
        sodium: offProduct.sodium,
        favorite: false,
        source: 'search',
        ean: offProduct.ean,
        brand: offProduct.brand,
        nutri_score: offProduct.nutri_score,
        image_url: offProduct.image_url,
        openfoodfacts_id: offProduct.openfoodfacts_id,
        last_synced: offProduct.last_synced,
      });
      alert(`✓ Product toegevoegd: ${offProduct.name}`);
    } catch (error: any) {
      console.error('Error adding product from OFF:', error);
      alert(error.message || 'Fout bij toevoegen product.');
    } finally {
      setIsLoadingFromOff(false);
    }
  };

  // Filter and sort products with debounced search
  const filteredProducts = useMemo(() =>
    products
      .filter(product => {
        // Search in both name and brand
        const searchTerm = debouncedSearchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(searchTerm);
        const matchesBrand = product.brand?.toLowerCase().includes(searchTerm) || false;
        const matchesSearch = matchesName || matchesBrand;

        if (!matchesSearch) return false;

        if (showOnlyWithPortions) {
          const productPortions = allPortions.filter(p => p.productName === product.name);
          return productPortions.length > 0;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'favorite') {
          if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'name-desc') {
          return b.name.localeCompare(a.name);
        } else if (sortBy === 'calories') {
          return b.calories - a.calories;
        } else if (sortBy === 'protein') {
          return b.protein - a.protein;
        }
        return 0;
      }),
    [products, debouncedSearchQuery, showOnlyWithPortions, allPortions, sortBy]
  );

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add New Product Buttons - MOVED TO TOP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={handleAddProduct}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          disabled={isLoadingFromOff}
        >
          ➕ Nieuw
        </button>
        <button
          onClick={() => setShowBarcodeScanner(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          disabled={isLoadingFromOff}
        >
          📷 Scan
        </button>
        <button
          onClick={() => setShowOffSearch(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
          disabled={isLoadingFromOff}
        >
          🔍 Zoek
        </button>
        <button
          onClick={() => setShowJsonImport(!showJsonImport)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
        >
          📥 JSON
        </button>
      </div>

      {/* JSON Import Section */}
      {showJsonImport && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm h-32 mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder='{"name": "Product", "calories": 100, ...} of [...]'
          />
          <div className="flex gap-2">
            <button
              onClick={handleImportJson}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Importeer
            </button>
            <button
              onClick={() => {
                setShowJsonImport(false);
                setJsonInput('');
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              Annuleer
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoadingFromOff && (
        <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
          Bezig met ophalen product uit OpenFoodFacts...
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        {/* Search bar + Sort + Toggle - stacked on mobile, side by side on desktop */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Zoek op naam of merk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="favorite">Favorieten eerst</option>
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
            <option value="calories">Calorieën (hoog-laag)</option>
            <option value="protein">Eiwit (hoog-laag)</option>
          </select>

          <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showOnlyWithPortions}
              onChange={(e) => setShowOnlyWithPortions(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Alleen met porties</span>
          </label>
        </div>
      </div>

      {/* Products Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {filteredProducts.length} product{filteredProducts.length !== 1 ? 'en' : ''} gevonden
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Geen producten gevonden
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductWithPortions
              key={product.id}
              product={product}
              allPortions={allPortions}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddPortion={handleAddPortion}
              onEditPortion={handleEditPortion}
              onDeletePortion={handleDeletePortion}
              onSetDefaultPortion={handleSetDefaultPortion}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <ProductEditModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
      <PortionModal
        isOpen={showPortionModal}
        onClose={() => setShowPortionModal(false)}
        portion={editingPortion}
        productName={portionProductName}
        onSave={handleSavePortion}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowBarcodeScanner(false)}
      />

      {/* OpenFoodFacts Search Modal */}
      <OpenFoodFactsSearch
        isOpen={showOffSearch}
        onSelectProduct={handleOffProductSelect}
        onClose={() => setShowOffSearch(false)}
      />
    </div>
  );
}

// Sub-component for product with portions
// Memoized to prevent unnecessary re-renders when parent re-renders
interface ProductWithPortionsProps {
  product: Product;
  allPortions: ProductPortion[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onAddPortion: (productName: string) => void;
  onEditPortion: (portion: ProductPortion) => void;
  onDeletePortion: (portion: ProductPortion) => void;
  onSetDefaultPortion: (portion: ProductPortion) => void;
}

const ProductWithPortions = memo(function ProductWithPortions({
  product,
  allPortions,
  onEditProduct,
  onDeleteProduct,
  onAddPortion,
  onEditPortion,
  onDeletePortion,
  onSetDefaultPortion,
}: ProductWithPortionsProps) {
  // Memoize portion filtering to avoid recalculating on every render
  const productPortions = useMemo(
    () => allPortions.filter(p => p.productName === product.name),
    [allPortions, product.name]
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {/* Product Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {product.favorite && '⭐ '}
            {product.name}
            {product.brand && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({product.brand})</span>}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => onEditProduct(product)}
              className="text-xl hover:scale-110 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Bewerken"
            >
              ✏️
            </button>
            <button
              onClick={() => onDeleteProduct(product)}
              className="text-xl hover:scale-110 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Verwijderen"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Nutrition Info */}
        <div className="text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
          <div className="whitespace-nowrap">
            📊 Per 100{product.calories > 0 ? 'g' : 'ml'}: {product.calories} kcal • {product.protein}g eiw • {product.carbohydrates}g koolh • {product.sugars}g suik • {product.saturatedFat}g v.vet • {product.fiber}g vez • {product.sodium}mg natr
          </div>
        </div>

        {/* Source and Nutri-Score Badges + Add Portion Button */}
        <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Source Badge */}
            <span className={`text-xs px-2 py-0.5 rounded ${
              product.source === 'barcode' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
              product.source === 'search' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {product.source === 'barcode' ? '📷 Barcode' : product.source === 'search' ? '🔍 Search' : '✏️ Manual'}
            </span>
            {/* Nutri-Score Badge */}
            {product.nutri_score && (
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                product.nutri_score === 'A' ? 'bg-green-500 text-white' :
                product.nutri_score === 'B' ? 'bg-green-300 text-gray-800' :
                product.nutri_score === 'C' ? 'bg-yellow-300 text-gray-800' :
                product.nutri_score === 'D' ? 'bg-orange-400 text-white' :
                'bg-red-500 text-white'
              }`}>
                Nutri-Score: {product.nutri_score}
              </span>
            )}
          </div>
          {/* Add Portion Button - Aligned right with edit/delete buttons */}
          <button
            onClick={() => onAddPortion(product.name)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium whitespace-nowrap"
          >
            + Nieuwe portie
          </button>
        </div>
      </div>

      {/* Portions Section */}
      {productPortions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Porties ({productPortions.length}):
          </h4>
          <div className="space-y-1">
            {productPortions.map(portion => (
              <div key={portion.id} className="flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {portion.isDefault && '⭐ '}
                  {portion.portionName} ({portion.grams}g)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onSetDefaultPortion(portion)}
                    className="px-2 py-1 hover:scale-110 transition"
                    title={portion.isDefault ? "Default verwijderen" : "Zet als default"}
                  >
                    {portion.isDefault ? '☆' : '⭐'}
                  </button>
                  <button
                    onClick={() => onEditPortion(portion)}
                    className="px-2 py-1 hover:scale-110 transition"
                    title="Bewerken"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDeletePortion(portion)}
                    className="px-2 py-1 hover:scale-110 transition"
                    title="Verwijderen"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
