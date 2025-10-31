/**
 * AddMealModal - Modal voor maaltijd toevoegen (3 tabs: producten/handmatig/JSON)
 */

import React, { useState } from 'react';
import type { Product, Entry } from '@/types';
import { getCurrentTime, calculateProductNutrition, roundNutritionValues } from '@/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddMeal: (meal: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  products: Product[];
  selectedDate: string;
}

type Tab = 'products' | 'manual' | 'json';

export function AddMealModal({ isOpen, onClose, onAddMeal, products, selectedDate }: Props) {
  const [tab, setTab] = useState<Tab>('products');
  const [mealTime, setMealTime] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productGrams, setProductGrams] = useState<Record<string, number>>({});
  const [productSearch, setProductSearch] = useState('');
  const [manualMeal, setManualMeal] = useState({
    time: '', name: '', calories: '', protein: '', fat: '', saturatedFat: '', fiber: '', sodium: ''
  });
  const [mealJson, setMealJson] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setTab('products');
    setMealTime('');
    setSelectedProducts([]);
    setProductGrams({});
    setProductSearch('');
    setManualMeal({ time: '', name: '', calories: '', protein: '', fat: '', saturatedFat: '', fiber: '', sodium: '' });
    setMealJson('');
    onClose();
  };

  const handleAddFromProducts = async () => {
    if (selectedProducts.length === 0) return;

    const time = mealTime || getCurrentTime();
    let totals = { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 };
    const productDetails: Array<{ name: string; grams: number }> = [];

    selectedProducts.forEach(prodName => {
      const product = products.find(p => p.name === prodName);
      if (!product) return;
      const grams = productGrams[prodName] || 100;
      const nutrition = calculateProductNutrition(product, grams);

      totals.calories += nutrition.calories;
      totals.protein += nutrition.protein;
      totals.fat += nutrition.fat;
      totals.saturatedFat += nutrition.saturatedFat;
      totals.fiber += nutrition.fiber;
      totals.sodium += nutrition.sodium;

      productDetails.push({ name: prodName, grams });
    });

    const name = productDetails.map(p => `${p.name} (${p.grams}g)`).join(' + ');
    await onAddMeal({
      date: selectedDate,
      time,
      name,
      products: productDetails,
      ...roundNutritionValues(totals)
    });
    resetForm();
  };

  const handleAddManually = async () => {
    await onAddMeal({
      date: selectedDate,
      time: manualMeal.time || getCurrentTime(),
      name: manualMeal.name,
      calories: parseInt(manualMeal.calories) || 0,
      protein: parseFloat(manualMeal.protein) || 0,
      fat: parseFloat(manualMeal.fat) || 0,
      saturatedFat: parseFloat(manualMeal.saturatedFat) || 0,
      fiber: parseFloat(manualMeal.fiber) || 0,
      sodium: parseInt(manualMeal.sodium) || 0,
    });
    resetForm();
  };

  const handleImportJson = async () => {
    try {
      const data = JSON.parse(mealJson);
      await onAddMeal({
        date: selectedDate,
        time: data.time || getCurrentTime(),
        name: data.name || 'Geïmporteerde maaltijd',
        calories: parseInt(data.calories) || 0,
        protein: parseFloat(data.protein) || 0,
        fat: parseFloat(data.fat) || 0,
        saturatedFat: parseFloat(data.saturatedFat) || 0,
        fiber: parseFloat(data.fiber) || 0,
        sodium: parseInt(data.sodium) || 0,
      });
      resetForm();
    } catch (e) {
      alert('Ongeldige JSON');
    }
  };

  const filteredProducts = products
    .filter(p => productSearch === '' || p.name.toLowerCase().includes(productSearch.toLowerCase()))
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Maaltijd toevoegen</h3>
          <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(['products', 'manual', 'json'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {t === 'products' ? 'Producten' : t === 'manual' ? 'Handmatig' : 'JSON'}
              </button>
            ))}
          </div>

          {/* Products Tab */}
          {tab === 'products' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tijd (optioneel)</label>
                <input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="mb-4">
                <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Zoek product..." className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2" />
                <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                  {filteredProducts.map(product => (
                    <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                      <input type="checkbox" checked={selectedProducts.includes(product.name)} onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.name]);
                          setProductGrams({...productGrams, [product.name]: 100});
                        } else {
                          setSelectedProducts(selectedProducts.filter(p => p !== product.name));
                        }
                      }} className="w-4 h-4" />
                      <span className="flex-1">{product.favorite && '⭐ '}{product.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              {selectedProducts.length > 0 && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-2">Geselecteerd ({selectedProducts.length}):</h4>
                  {selectedProducts.map(name => (
                    <div key={name} className="flex items-center gap-2 bg-white rounded p-2 mb-2">
                      <span className="flex-1 font-medium">{name}</span>
                      <input type="number" value={productGrams[name] || 100} onChange={(e) => setProductGrams({...productGrams, [name]: parseInt(e.target.value) || 100})} className="w-20 px-2 py-1 border rounded text-center" min="1" />
                      <span>g</span>
                      <button onClick={() => setSelectedProducts(selectedProducts.filter(p => p !== name))} className="text-red-600 hover:text-red-800 font-bold">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleAddFromProducts} disabled={selectedProducts.length === 0} className={`w-full px-4 py-2 rounded-lg font-semibold ${selectedProducts.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                Toevoegen {selectedProducts.length > 0 && `(${selectedProducts.length})`}
              </button>
            </div>
          )}

          {/* Manual Tab */}
          {tab === 'manual' && (
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Tijd</label><input type="time" value={manualMeal.time} onChange={(e) => setManualMeal({...manualMeal, time: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Naam</label><input type="text" value={manualMeal.name} onChange={(e) => setManualMeal({...manualMeal, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                {(['calories', 'protein', 'fat', 'saturatedFat', 'fiber', 'sodium'] as const).map(field => (
                  <div key={field}><label className="block text-xs font-medium mb-1">{field === 'calories' ? 'Calorieën' : field === 'protein' ? 'Eiwit (g)' : field === 'fat' ? 'Vet (g)' : field === 'saturatedFat' ? 'Verz. vet (g)' : field === 'fiber' ? 'Vezels (g)' : 'Natrium (mg)'}</label><input type="number" step={field === 'calories' || field === 'sodium' ? '1' : '0.1'} value={manualMeal[field]} onChange={(e) => setManualMeal({...manualMeal, [field]: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                ))}
              </div>
              <button onClick={handleAddManually} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Toevoegen</button>
            </div>
          )}

          {/* JSON Tab */}
          {tab === 'json' && (
            <div>
              <textarea value={mealJson} onChange={(e) => setMealJson(e.target.value)} className="w-full px-4 py-2 border rounded-lg font-mono text-sm h-64 mb-4" placeholder='{"time": "12:00", "name": "Lunch", "calories": 500, ...}' />
              <button onClick={handleImportJson} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Importeer JSON</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
