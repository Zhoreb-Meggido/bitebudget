import { useState } from 'react';
import { useProducts, usePortions } from '@/hooks';
import type { Product, ProductPortion } from '@/types';
import { ProductEditModal } from './ProductEditModal';
import { PortionEditModal } from './PortionEditModal';
import { BarcodeScanner } from '../journal/BarcodeScanner';
import { OpenFoodFactsSearch } from '../journal/OpenFoodFactsSearch';
import { openFoodFactsService } from '@/services/openfoodfacts.service';

export function ProductsPortionsTab() {
  const { products, isLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { portions: allPortions, addPortion, updatePortion, deletePortion, setDefaultPortion } = usePortions();

  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyWithPortions, setShowOnlyWithPortions] = useState(false);

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

  // Handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Weet je zeker dat je "${product.name}" wilt verwijderen?`)) {
      return;
    }
    await deleteProduct(product.id!);
  };

  const handleSaveProduct = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id!, data);
    } else {
      await addProduct(data);
    }
  };

  const handleAddPortion = (productName: string) => {
    setPortionProductName(productName);
    setEditingPortion(null);
    setShowPortionModal(true);
  };

  const handleEditPortion = (portion: ProductPortion) => {
    setPortionProductName(portion.productName);
    setEditingPortion(portion);
    setShowPortionModal(true);
  };

  const handleDeletePortion = async (portion: ProductPortion) => {
    if (!confirm(`Weet je zeker dat je portie "${portion.portionName}" wilt verwijderen?`)) {
      return;
    }
    await deletePortion(portion.id!);
  };

  const handleSetDefaultPortion = async (portion: ProductPortion) => {
    await setDefaultPortion(portion.id!);
  };

  const handleSavePortion = async (data: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingPortion) {
      await updatePortion(editingPortion.id!, data);
    } else {
      await addPortion(data);
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
        // Add product from OpenFoodFacts
        await addProduct({
          name: offProduct.name,
          brand: offProduct.brand,
          ean: barcode,
          source: 'barcode',
          calories: offProduct.calories,
          protein: offProduct.protein,
          carbohydrates: offProduct.carbohydrates,
          sugars: offProduct.sugars,
          fat: offProduct.fat,
          saturatedFat: offProduct.saturatedFat,
          fiber: offProduct.fiber,
          sodium: offProduct.sodium,
          nutri_score: offProduct.nutri_score,
          image_url: offProduct.image_url,
          favorite: false,
        });
        alert(`✓ Product toegevoegd: ${offProduct.name}`);
      } else {
        alert('Product niet gevonden in OpenFoodFacts database. Probeer handmatig toevoegen.');
      }
    } catch (error) {
      console.error('Error fetching product from OFF:', error);
      alert('Fout bij ophalen product. Controleer je internetverbinding.');
    } finally {
      setIsLoadingFromOff(false);
    }
  };

  // OpenFoodFacts search handler
  const handleOffProductSelect = async (offProduct: any) => {
    setShowOffSearch(false);
    setIsLoadingFromOff(true);

    try {
      await addProduct({
        name: offProduct.name,
        brand: offProduct.brand,
        ean: offProduct.ean,
        source: 'search',
        calories: offProduct.calories,
        protein: offProduct.protein,
        carbohydrates: offProduct.carbohydrates,
        sugars: offProduct.sugars,
        fat: offProduct.fat,
        saturatedFat: offProduct.saturatedFat,
        fiber: offProduct.fiber,
        sodium: offProduct.sodium,
        nutri_score: offProduct.nutri_score,
        image_url: offProduct.image_url,
        favorite: false,
      });
      alert(`✓ Product toegevoegd: ${offProduct.name}`);
    } catch (error) {
      console.error('Error adding product from OFF:', error);
      alert('Fout bij toevoegen product.');
    } finally {
      setIsLoadingFromOff(false);
    }
  };

  // Filter products based on search and portions filter
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (showOnlyWithPortions) {
      const productPortions = allPortions.filter(p => p.productName === product.name);
      return productPortions.length > 0;
    }

    return true;
  });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek producten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={showOnlyWithPortions}
            onChange={(e) => setShowOnlyWithPortions(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Alleen met porties</span>
        </label>
      </div>

      {/* Products Count */}
      <div className="text-sm text-gray-600">
        {filteredProducts.length} product{filteredProducts.length !== 1 ? 'en' : ''} gevonden
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
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

      {/* Add New Product Buttons */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleAddProduct}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            disabled={isLoadingFromOff}
          >
            ✏️ Handmatig
          </button>
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            disabled={isLoadingFromOff}
          >
            📷 Scan Barcode
          </button>
          <button
            onClick={() => setShowOffSearch(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            disabled={isLoadingFromOff}
          >
            🔍 Zoek in OFF
          </button>
        </div>
        {isLoadingFromOff && (
          <div className="mt-2 text-sm text-gray-600">
            Bezig met ophalen product uit OpenFoodFacts...
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductEditModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
      <PortionEditModal
        isOpen={showPortionModal}
        onClose={() => setShowPortionModal(false)}
        portion={editingPortion}
        productName={portionProductName}
        onSave={handleSavePortion}
      />

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Scan Barcode</h2>
              <button
                onClick={() => setShowBarcodeScanner(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <BarcodeScanner
                onScan={handleBarcodeScan}
                onClose={() => setShowBarcodeScanner(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* OpenFoodFacts Search Modal */}
      {showOffSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Zoek in OpenFoodFacts</h2>
              <button
                onClick={() => setShowOffSearch(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <OpenFoodFactsSearch
                onProductSelect={handleOffProductSelect}
                onClose={() => setShowOffSearch(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for product with portions
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

function ProductWithPortions({
  product,
  allPortions,
  onEditProduct,
  onDeleteProduct,
  onAddPortion,
  onEditPortion,
  onDeletePortion,
  onSetDefaultPortion,
}: ProductWithPortionsProps) {
  const productPortions = allPortions.filter(p => p.productName === product.name);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Product Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {product.favorite && '⭐ '}
            {product.name}
            {product.brand && <span className="text-sm text-gray-500 ml-2">({product.brand})</span>}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => onEditProduct(product)}
              className="px-2 py-1 text-xl hover:scale-110 transition"
              title="Bewerken"
            >
              ✏️
            </button>
            <button
              onClick={() => onDeleteProduct(product)}
              className="px-2 py-1 text-xl hover:scale-110 transition"
              title="Verwijderen"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Nutrition Info */}
        <div className="text-sm text-gray-600">
          📊 Per 100{product.calories > 0 ? 'g' : 'ml'}: {product.calories} kcal, {product.protein}g eiwit, {product.fat}g vet
          {product.carbohydrates !== undefined && `, ${product.carbohydrates}g koolhydraten`}
        </div>
      </div>

      {/* Portions Section */}
      {productPortions.length > 0 ? (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Porties ({productPortions.length}):
          </h4>
          <div className="space-y-1">
            {productPortions.map(portion => (
              <div key={portion.id} className="flex items-center justify-between bg-white px-3 py-2 rounded">
                <span className="text-sm">
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
      ) : null}

      {/* Add Portion Button */}
      <div className="mt-3 pt-3 border-t border-gray-300">
        <button
          onClick={() => onAddPortion(product.name)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Nieuwe portie
        </button>
      </div>
    </div>
  );
}
