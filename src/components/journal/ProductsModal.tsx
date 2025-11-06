/**
 * ProductsModal - Producten database beheer
 */

import React, { useState, useEffect } from 'react';
import type { Product, ProductPortion } from '@/types';
import { BarcodeScanner } from './BarcodeScanner';
import { OpenFoodFactsSearch } from './OpenFoodFactsSearch';
import { openFoodFactsService } from '@/services/openfoodfacts.service';
import { usePortions } from '@/hooks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateProduct: (id: number | string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: number | string) => Promise<void>;
  onToggleFavorite: (id: number | string) => Promise<void>;
  onImportJson: (json: string) => Promise<void>;
  inline?: boolean; // Optional: render inline instead of as modal
}

export function ProductsModal({ isOpen, onClose, products, onAddProduct, onUpdateProduct, onDeleteProduct, onToggleFavorite, onImportJson, inline = false }: Props) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', calories: '', protein: '', carbohydrates: '', sugars: '', fat: '', saturatedFat: '', fiber: '', sodium: '', favorite: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('favorite');
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showOffSearch, setShowOffSearch] = useState(false);
  const [isLoadingFromOff, setIsLoadingFromOff] = useState(false);

  // Portions management
  const { portions: allPortions, addPortion, updatePortion, deletePortion, setDefaultPortion } = usePortions();
  const [productPortions, setProductPortions] = useState<ProductPortion[]>([]);
  const [showAddPortion, setShowAddPortion] = useState(false);

  // Load portions when editing a product
  useEffect(() => {
    if (editingProduct) {
      const portions = allPortions.filter(p => p.productName === editingProduct.name);
      setProductPortions(portions);
    } else {
      setProductPortions([]);
    }
  }, [editingProduct, allPortions]);

  if (!isOpen && !inline) return null;

  const resetForm = () => {
    setProductForm({ name: '', calories: '', protein: '', carbohydrates: '', sugars: '', fat: '', saturatedFat: '', fiber: '', sodium: '', favorite: false });
    setEditingProduct(null);
    setShowAddProduct(false);
  };

  const handleSubmit = async () => {
    if (!productForm.name) return;
    const data = {
      name: productForm.name,
      calories: parseFloat(productForm.calories) || 0,
      protein: parseFloat(productForm.protein) || 0,
      carbohydrates: parseFloat(productForm.carbohydrates) || 0,
      sugars: parseFloat(productForm.sugars) || 0,
      fat: parseFloat(productForm.fat) || 0,
      saturatedFat: parseFloat(productForm.saturatedFat) || 0,
      fiber: parseFloat(productForm.fiber) || 0,
      sodium: parseInt(productForm.sodium) || 0,
      favorite: productForm.favorite,
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id!, data);
    } else {
      await onAddProduct(data);
    }
    resetForm();
  };

  const handleImportJsonClick = async () => {
    try {
      await onImportJson(jsonInput);
      setJsonInput('');
      setShowJsonImport(false);
    } catch (e) {
      alert('JSON import failed');
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    setShowBarcodeScanner(false);
    setIsLoadingFromOff(true);

    try {
      // Lookup product in OpenFoodFacts
      const product = await openFoodFactsService.getProductByBarcode(barcode);

      if (product) {
        // Directly add the product with all OpenFoodFacts fields
        try {
          await onAddProduct({
            name: product.name,
            calories: product.calories,
            protein: product.protein,
            carbohydrates: product.carbohydrates,
            sugars: product.sugars,
            fat: product.fat,
            saturatedFat: product.saturatedFat,
            fiber: product.fiber,
            sodium: product.sodium,
            favorite: false,
            source: product.source,
            ean: product.ean,
            brand: product.brand,
            nutri_score: product.nutri_score,
            image_url: product.image_url,
            openfoodfacts_id: product.openfoodfacts_id,
            last_synced: product.last_synced,
          });
          alert(`✅ Product toegevoegd: ${product.name}`);
        } catch (error: any) {
          // Handle duplicate error
          alert(error.message || 'Fout bij toevoegen product');
        }
      } else {
        alert('❌ Product niet gevonden in OpenFoodFacts database');
      }
    } finally {
      setIsLoadingFromOff(false);
    }
  };

  const handleOffProductSelect = async (product: Product) => {
    // Directly add the product with all OpenFoodFacts fields
    await onAddProduct({
      name: product.name,
      calories: product.calories,
      protein: product.protein,
      carbohydrates: product.carbohydrates,
      sugars: product.sugars,
      fat: product.fat,
      saturatedFat: product.saturatedFat,
      fiber: product.fiber,
      sodium: product.sodium,
      favorite: false,
      source: product.source,
      ean: product.ean,
      brand: product.brand,
      nutri_score: product.nutri_score,
      image_url: product.image_url,
      openfoodfacts_id: product.openfoodfacts_id,
      last_synced: product.last_synced,
    });
    setShowOffSearch(false);
  };

  const filteredProducts = products
    .filter(p => searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'favorite') {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      else if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      else if (sortBy === 'calories') return b.calories - a.calories;
      else if (sortBy === 'protein') return b.protein - a.protein;
      return 0;
    });

  const contentElement = (
    <>
      <div className={inline ? "bg-white rounded-xl shadow-lg w-full" : "bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto"}>
        <div className={inline ? "bg-white border-b p-4" : "sticky top-0 bg-white border-b p-4 flex justify-between items-center"}>
          <h3 className="text-xl font-bold">Producten Database</h3>
          {!inline && <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setShowAddProduct(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">➕ Nieuw</button>
            <button onClick={() => setShowBarcodeScanner(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">📷 Scan</button>
            <button onClick={() => setShowOffSearch(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">🔍 Zoek</button>
            <button onClick={() => setShowJsonImport(!showJsonImport)} className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700">📥 JSON</button>
          </div>

          {showJsonImport && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full px-4 py-2 border rounded-lg font-mono text-sm h-32 mb-2" placeholder='{"name": "Product", ...} of [...]' />
              <div className="flex gap-2">
                <button onClick={handleImportJsonClick} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Importeer</button>
                <button onClick={() => { setShowJsonImport(false); setJsonInput(''); }} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuleer</button>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Zoek..." className="flex-1 px-4 py-2 border rounded-lg" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="favorite">Favorieten</option>
              <option value="name-asc">A-Z</option>
              <option value="name-desc">Z-A</option>
              <option value="calories">Calorieën</option>
              <option value="protein">Eiwit</option>
            </select>
          </div>

          <div className="space-y-2">
            {filteredProducts.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <button onClick={() => onToggleFavorite(p.id!)} className="text-xl flex-shrink-0">{p.favorite ? '⭐' : '☆'}</button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{p.name}</span>
                    {p.brand && <span className="text-xs text-gray-500">({p.brand})</span>}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{p.calories} kcal • {p.protein}g eiw • {p.carbohydrates}g koolh • {p.sugars}g suik • {p.saturatedFat}g v.vet • {p.fiber}g vez • {p.sodium}mg natr</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {/* Source Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      p.source === 'barcode' ? 'bg-blue-100 text-blue-700' :
                      p.source === 'search' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {p.source === 'barcode' ? '📷 Barcode' : p.source === 'search' ? '🔍 Search' : '✏️ Manual'}
                    </span>
                    {/* Nutri-Score Badge */}
                    {p.nutri_score && (
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        p.nutri_score === 'A' ? 'bg-green-500 text-white' :
                        p.nutri_score === 'B' ? 'bg-green-300 text-gray-800' :
                        p.nutri_score === 'C' ? 'bg-yellow-300 text-gray-800' :
                        p.nutri_score === 'D' ? 'bg-orange-400 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        Nutri-Score: {p.nutri_score}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => { setEditingProduct(p); setProductForm(p as any); setShowAddProduct(true); }} className="px-2 py-1 text-xl hover:scale-110 transition flex-shrink-0" title="Bewerken">✏️</button>
                <button onClick={() => { if (confirm('Verwijder?')) onDeleteProduct(p.id!); }} className="px-2 py-1 text-xl hover:scale-110 transition flex-shrink-0" title="Verwijderen">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Bewerken' : 'Nieuw Product'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Naam</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  placeholder="Productnaam"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['calories', 'protein', 'carbohydrates', 'sugars', 'fat', 'saturatedFat', 'fiber', 'sodium'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-xs font-medium mb-1">
                      {field === 'calories' ? 'Cal' : field === 'protein' ? 'Eiw' : field === 'carbohydrates' ? 'Koolh' : field === 'sugars' ? 'Suik' : field === 'fat' ? 'Vet' : field === 'saturatedFat' ? 'V.vet' : field === 'fiber' ? 'Vez' : 'Natr'} (per 100g)
                    </label>
                    <input
                      type="number"
                      step={field === 'calories' || field === 'sodium' ? '1' : '0.1'}
                      value={productForm[field]}
                      onChange={(e) => setProductForm({...productForm, [field]: e.target.value})}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      className="w-full px-2 py-2 border rounded-lg text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={productForm.favorite}
                  onChange={(e) => setProductForm({...productForm, favorite: e.target.checked})}
                />
                <label className="text-sm">Favoriet ⭐</label>
              </div>

              {/* Portions Management - Only when editing */}
              {editingProduct && (
                <div className="border-t pt-3 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">Porties (optioneel)</h4>
                    <button
                      onClick={() => setShowAddPortion(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      + Nieuwe portie
                    </button>
                  </div>
                  {productPortions.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Nog geen porties gedefinieerd</p>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {productPortions.map(portion => (
                        <div key={portion.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs font-medium truncate">{portion.portionName}</span>
                            <span className="text-xs text-gray-600">({portion.grams}g)</span>
                            {portion.isDefault && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Default</span>}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {!portion.isDefault && (
                              <button
                                onClick={() => setDefaultPortion(editingProduct.name, portion.id!)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                                title="Stel in als default"
                              >
                                ⭐
                              </button>
                            )}
                            <button
                              onClick={() => deletePortion(portion.id!)}
                              className="text-xs text-red-600 hover:text-red-800"
                              title="Verwijder"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">{editingProduct ? 'Bijwerken' : 'Toevoegen'}</button>
                <button onClick={resetForm} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300">Annuleer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Portion Modal */}
      {showAddPortion && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nieuwe portie voor {editingProduct.name}</h3>
            <AddPortionForm
              productName={editingProduct.name}
              onSave={async (portion) => {
                await addPortion(portion);
                setShowAddPortion(false);
              }}
              onCancel={() => setShowAddPortion(false)}
            />
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
      />

      {/* OpenFoodFacts Search */}
      <OpenFoodFactsSearch
        isOpen={showOffSearch}
        onClose={() => setShowOffSearch(false)}
        onSelectProduct={handleOffProductSelect}
      />

      {/* Loading Overlay for Barcode Scan */}
      {isLoadingFromOff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-spin">⏳</span>
              <div>
                <div className="font-semibold text-blue-900">Product opzoeken...</div>
                <div className="text-sm text-blue-700">OpenFoodFacts database wordt doorzocht</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Return inline or as modal
  if (inline) {
    return contentElement;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {contentElement}
    </div>
  );
}

// Helper component for adding portions
function AddPortionForm({ productName, onSave, onCancel }: {
  productName: string;
  onSave: (portion: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [portionName, setPortionName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'g' | 'ml' | 'stuks' | 'el' | 'tl'>('g');
  const [gramsPerUnit, setGramsPerUnit] = useState('');

  const calculateGrams = (): number => {
    const amt = parseInt(amount) || 0;
    if (unit === 'g') return amt;
    if (unit === 'ml') return amt; // 1:1 for liquids
    if (unit === 'el') return amt * 15;
    if (unit === 'tl') return amt * 5;
    if (unit === 'stuks') return amt * (parseInt(gramsPerUnit) || 0);
    return amt;
  };

  const handleSave = async () => {
    if (!portionName.trim() || !amount) {
      alert('Vul alle velden in');
      return;
    }

    if (unit === 'stuks' && !gramsPerUnit) {
      alert('Vul het aantal grammen per stuk in');
      return;
    }

    const grams = calculateGrams();
    await onSave({
      productName,
      portionName,
      amount: parseInt(amount),
      unit,
      gramsPerUnit: unit === 'stuks' ? parseInt(gramsPerUnit) : undefined,
      grams,
      isDefault: false,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Naam portie</label>
        <input
          type="text"
          value={portionName}
          onChange={(e) => setPortionName(e.target.value)}
          placeholder="Bijv. 1 snee, 1 kop"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hoeveelheid</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Eenheid</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof unit)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="g">gram (g)</option>
            <option value="ml">milliliter (ml)</option>
            <option value="stuks">stuks</option>
            <option value="el">eetlepel (el)</option>
            <option value="tl">theelepel (tl)</option>
          </select>
        </div>
      </div>

      {unit === 'stuks' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grammen per stuk</label>
          <input
            type="number"
            value={gramsPerUnit}
            onChange={(e) => setGramsPerUnit(e.target.value)}
            placeholder="Bijv. 35"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            min="1"
          />
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-sm text-gray-700">
          Totaal: <span className="font-semibold">{calculateGrams()}g</span>
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
        >
          Annuleren
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
        >
          Opslaan
        </button>
      </div>
    </div>
  );
}
