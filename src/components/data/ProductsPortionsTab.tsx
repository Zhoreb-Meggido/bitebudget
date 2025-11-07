import { useState } from 'react';
import { useProducts, usePortions } from '@/hooks';
import type { Product, ProductPortion } from '@/types';
import { ProductEditModal } from './ProductEditModal';
import { PortionEditModal } from './PortionEditModal';

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

      {/* Add New Product Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleAddProduct}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          + Nieuw product
        </button>
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
