/**
 * AddMealModal - Modal voor maaltijd toevoegen (3 tabs: producten/handmatig/JSON)
 */

import React, { useState, useEffect } from 'react';
import type { Product, Entry, MealTemplate, MealCategory, ProductPortion } from '@/types';
import { getCurrentTime, calculateProductNutrition, roundNutritionValues } from '@/utils';
import { useTemplates, usePortions } from '@/hooks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddMeal: (meal: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  products: Product[];
  selectedDate: string;
  editEntry?: Entry; // Optional: when editing an existing entry
  onUpdateMeal?: (id: number | string, meal: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  quickAddTemplate?: MealTemplate | null; // Optional: prefill from quick add
}

type Tab = 'products' | 'manual' | 'json' | 'templates';

export function AddMealModal({ isOpen, onClose, onAddMeal, products, selectedDate, editEntry, onUpdateMeal, quickAddTemplate }: Props) {
  const [tab, setTab] = useState<Tab>('products');
  const [mealTime, setMealTime] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productGrams, setProductGrams] = useState<Record<string, number>>({});
  const [productSearch, setProductSearch] = useState('');
  const [manualMeal, setManualMeal] = useState({
    time: '', name: '', calories: '', protein: '', carbohydrates: '', sugars: '', fat: '', saturatedFat: '', fiber: '', sodium: ''
  });
  const [mealJson, setMealJson] = useState('');

  // Templates state
  const { templates, recentTemplates, favoriteTemplates, addTemplate, deleteTemplate, toggleFavorite, trackUsage } = useTemplates();
  const [templateSearch, setTemplateSearch] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<MealCategory>('anders');

  // Portions state
  const { portions: allPortions, addPortion } = usePortions();
  const [productPortions, setProductPortions] = useState<Record<string, ProductPortion[]>>({});
  const [showAddPortionModal, setShowAddPortionModal] = useState(false);
  const [addPortionForProduct, setAddPortionForProduct] = useState<string>('');

  // Load portions for selected products
  useEffect(() => {
    const loadPortionsForProducts = async () => {
      const portionsMap: Record<string, ProductPortion[]> = {};
      for (const prodName of selectedProducts) {
        const prodPortions = allPortions.filter(p => p.productName === prodName);
        portionsMap[prodName] = prodPortions;
      }
      setProductPortions(portionsMap);
    };
    loadPortionsForProducts();
  }, [selectedProducts, allPortions]);

  // Load quick add template when provided
  useEffect(() => {
    if (quickAddTemplate && isOpen && !editEntry) {
      // Load template products into products tab
      const prodNames = quickAddTemplate.products.map(p => p.name);
      const grams: Record<string, number> = {};
      quickAddTemplate.products.forEach(p => {
        grams[p.name] = p.grams;
      });

      setSelectedProducts(prodNames);
      setProductGrams(grams);
      setMealTime(getCurrentTime());
      setTab('products'); // Open on products tab for adjustments
    }
  }, [quickAddTemplate, isOpen, editEntry]);

  // Load entry data when editing
  useEffect(() => {
    if (editEntry && isOpen) {
      // Check if entry has products array - use products tab
      if (editEntry.products && Array.isArray(editEntry.products) && editEntry.products.length > 0) {
        setTab('products');
        setMealTime(editEntry.time);
        const prodNames = editEntry.products.map(p => p.name);
        const grams: Record<string, number> = {};
        editEntry.products.forEach(p => {
          grams[p.name] = p.grams;
        });
        setSelectedProducts(prodNames);
        setProductGrams(grams);
      } else {
        // Use manual tab for entries without products
        setTab('manual');
        setManualMeal({
          time: editEntry.time,
          name: editEntry.name,
          calories: editEntry.calories.toString(),
          protein: editEntry.protein.toString(),
          carbohydrates: editEntry.carbohydrates?.toString() || '0',
          sugars: editEntry.sugars?.toString() || '0',
          fat: editEntry.fat.toString(),
          saturatedFat: editEntry.saturatedFat.toString(),
          fiber: editEntry.fiber.toString(),
          sodium: editEntry.sodium.toString(),
        });
      }
    } else if (!isOpen) {
      // Reset when modal closes
      setTab('products');
      setMealTime('');
      setSelectedProducts([]);
      setProductGrams({});
      setProductSearch('');
      setManualMeal({ time: '', name: '', calories: '', protein: '', carbohydrates: '', sugars: '', fat: '', saturatedFat: '', fiber: '', sodium: '' });
      setMealJson('');
    }
  }, [editEntry, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!editEntry;

  const resetForm = () => {
    setTab('products');
    setMealTime('');
    setSelectedProducts([]);
    setProductGrams({});
    setProductSearch('');
    setManualMeal({ time: '', name: '', calories: '', protein: '', carbohydrates: '', sugars: '', fat: '', saturatedFat: '', fiber: '', sodium: '' });
    setMealJson('');
    onClose();
  };

  const handleAddFromProducts = async () => {
    if (selectedProducts.length === 0) return;

    const time = mealTime || getCurrentTime();
    let totals = { calories: 0, protein: 0, carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 };
    const productDetails: Array<{ name: string; grams: number }> = [];

    selectedProducts.forEach(prodName => {
      const product = products.find(p => p.name === prodName);
      if (!product) return;
      const grams = productGrams[prodName] || 100;
      const nutrition = calculateProductNutrition(product, grams);

      totals.calories += nutrition.calories;
      totals.protein += nutrition.protein;
      totals.carbohydrates += nutrition.carbohydrates;
      totals.sugars += nutrition.sugars;
      totals.fat += nutrition.fat;
      totals.saturatedFat += nutrition.saturatedFat;
      totals.fiber += nutrition.fiber;
      totals.sodium += nutrition.sodium;

      productDetails.push({ name: prodName, grams });
    });

    const name = productDetails.map(p => `${p.name} (${p.grams}g)`).join(' + ');
    const mealData = {
      date: selectedDate,
      time,
      name,
      products: productDetails,
      ...roundNutritionValues(totals)
    };

    if (isEditMode && editEntry && onUpdateMeal) {
      await onUpdateMeal(editEntry.id!, mealData);
    } else {
      await onAddMeal(mealData);
    }
    resetForm();
  };

  const handleAddManually = async () => {
    const mealData = {
      date: selectedDate,
      time: manualMeal.time || getCurrentTime(),
      name: manualMeal.name,
      calories: parseInt(manualMeal.calories) || 0,
      protein: parseFloat(manualMeal.protein) || 0,
      carbohydrates: parseFloat(manualMeal.carbohydrates) || 0,
      sugars: parseFloat(manualMeal.sugars) || 0,
      fat: parseFloat(manualMeal.fat) || 0,
      saturatedFat: parseFloat(manualMeal.saturatedFat) || 0,
      fiber: parseFloat(manualMeal.fiber) || 0,
      sodium: parseInt(manualMeal.sodium) || 0,
    };

    if (isEditMode && editEntry && onUpdateMeal) {
      await onUpdateMeal(editEntry.id!, mealData);
    } else {
      await onAddMeal(mealData);
    }
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
        carbohydrates: parseFloat(data.carbohydrates) || 0,
        sugars: parseFloat(data.sugars) || 0,
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

  // Template handlers
  const handleLoadTemplate = async (template: MealTemplate) => {
    // Load template products into products tab
    const prodNames = template.products.map(p => p.name);
    const grams: Record<string, number> = {};
    template.products.forEach(p => {
      grams[p.name] = p.grams;
    });

    setSelectedProducts(prodNames);
    setProductGrams(grams);
    setMealTime(getCurrentTime());

    // Track usage
    await trackUsage(template.id!);

    // Switch to products tab
    setTab('products');
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Vul een naam in voor de template');
      return;
    }

    if (selectedProducts.length === 0) {
      alert('Selecteer minimaal 1 product');
      return;
    }

    const productDetails: Array<{ name: string; grams: number }> = [];
    selectedProducts.forEach(prodName => {
      const grams = productGrams[prodName] || 100;
      productDetails.push({ name: prodName, grams });
    });

    await addTemplate({
      name: newTemplateName,
      category: newTemplateCategory,
      products: productDetails,
      isFavorite: false,
      useCount: 0,
    });

    alert('Template opgeslagen!');
    setShowSaveTemplateModal(false);
    setNewTemplateName('');
    setNewTemplateCategory('anders');
  };

  const handleDeleteTemplate = async (id: number | string) => {
    if (confirm('Weet je zeker dat je deze template wilt verwijderen?')) {
      await deleteTemplate(id);
    }
  };

  // Calculate nutritional totals for template
  const calculateTemplateTotals = (template: MealTemplate) => {
    let totals = { calories: 0, protein: 0 };

    template.products.forEach(({ name, grams }) => {
      const product = products.find(p => p.name === name);
      if (!product) return;
      const nutrition = calculateProductNutrition(product, grams);
      totals.calories += nutrition.calories;
      totals.protein += nutrition.protein;
    });

    return totals;
  };

  const filteredProducts = products
    .filter(p => productSearch === '' || p.name.toLowerCase().includes(productSearch.toLowerCase()))
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const filteredTemplates = templates
    .filter(t => templateSearch === '' || t.name.toLowerCase().includes(templateSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-white border-b p-4 flex justify-between items-center rounded-t-xl flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-800">{isEditMode ? 'Maaltijd bewerken' : 'Maaltijd toevoegen'}</h3>
          <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {/* Tabs - Fixed */}
        <div className="flex-shrink-0 px-6 pt-4">
          <div className="grid grid-cols-4 gap-2">
            {(['products', 'templates', 'manual', 'json'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 rounded-lg font-medium transition text-sm ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {t === 'products' ? '📦 Producten' : t === 'templates' ? '⭐ Templates' : t === 'manual' ? '✏️ Handmatig' : '📋 JSON'}
              </button>
            ))}
          </div>
        </div>

        {/* Products Tab - Fixed sections at top */}
        {tab === 'products' && (
          <>
            {/* Time input - Fixed */}
            <div className="flex-shrink-0 px-6 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tijd (optioneel)</label>
              <input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>

            {/* Selected products - Fixed with max height */}
            {selectedProducts.length > 0 && (
              <div className="flex-shrink-0 px-6 pt-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 sticky top-0 bg-blue-50">Geselecteerd ({selectedProducts.length}):</h4>
                  <div className="space-y-2">
                    {selectedProducts.map(name => {
                      const product = products.find(p => p.name === name);
                      const portions = productPortions[name] || [];
                      const hasPortions = portions.length > 0;

                      return (
                        <div key={name} className="bg-white rounded-lg px-3 py-2 border border-blue-300">
                          {/* Product naam en verwijder knop */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex-1 text-sm font-medium truncate">{product?.favorite && '⭐ '}{name}</span>
                            <button
                              onClick={() => {
                                setSelectedProducts(selectedProducts.filter(p => p !== name));
                                const newGrams = {...productGrams};
                                delete newGrams[name];
                                setProductGrams(newGrams);
                              }}
                              className="text-red-500 hover:text-red-700 font-bold text-lg"
                              aria-label="Verwijder product"
                            >✕</button>
                          </div>

                          {/* Portie selector en gram input */}
                          <div className="flex items-center gap-2">
                            {hasPortions && (
                              <select
                                onChange={(e) => {
                                  const portionId = e.target.value;
                                  if (portionId === 'custom') return; // Keep manual input
                                  if (portionId === 'new') {
                                    setAddPortionForProduct(name);
                                    setShowAddPortionModal(true);
                                    return;
                                  }
                                  const portion = portions.find(p => p.id?.toString() === portionId);
                                  if (portion) {
                                    setProductGrams({...productGrams, [name]: portion.grams});
                                  }
                                }}
                                className="flex-1 px-2 py-1 border rounded text-xs"
                              >
                                <option value="custom">Handmatig</option>
                                {portions.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.portionName} ({p.grams}g)
                                  </option>
                                ))}
                                <option value="new">+ Nieuwe portie</option>
                              </select>
                            )}
                            <input
                              type="number"
                              value={productGrams[name] ?? ''}
                              onChange={(e) => setProductGrams({...productGrams, [name]: parseInt(e.target.value) || 0})}
                              onFocus={(e) => e.target.select()}
                              placeholder="100"
                              className="w-20 px-2 py-1 border rounded text-center text-sm"
                              min="1"
                            />
                            <span className="text-xs text-gray-500">g</span>
                            {!hasPortions && (
                              <button
                                onClick={() => {
                                  setAddPortionForProduct(name);
                                  setShowAddPortionModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs underline"
                              >
                                + Portie
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Search bar - Fixed */}
            <div className="flex-shrink-0 px-6 pt-3 pb-2">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Zoek product..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Products list - Scrollable */}
            <div className="flex-1 min-h-0 px-6 pb-4">
              <div className="h-full border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center text-gray-500 py-4 text-sm">Geen producten gevonden</p>
                  ) : (
                    filteredProducts.map(product => (
                      <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product.name]);
                              if (!productGrams[product.name]) {
                                setProductGrams({...productGrams, [product.name]: 100});
                              }
                            } else {
                              setSelectedProducts(selectedProducts.filter(p => p !== product.name));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="flex-1 text-sm">{product.favorite && '⭐ '}{product.name}</span>
                        <span className="text-xs text-gray-500">{product.calories} kcal</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Manual Tab */}
        {tab === 'manual' && (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tijd</label>
                <input
                  type="time"
                  value={manualMeal.time}
                  onChange={(e) => setManualMeal({...manualMeal, time: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Naam</label>
                <input
                  type="text"
                  value={manualMeal.name}
                  onChange={(e) => setManualMeal({...manualMeal, name: e.target.value})}
                  placeholder="Bijv. Lunch"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['calories', 'protein', 'carbohydrates', 'sugars', 'fat', 'saturatedFat', 'fiber', 'sodium'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-xs font-medium mb-1">
                      {field === 'calories' ? 'Calorieën' : field === 'protein' ? 'Eiwit (g)' : field === 'carbohydrates' ? 'Koolh (g)' : field === 'sugars' ? 'Suikers (g)' : field === 'fat' ? 'Vet (g)' : field === 'saturatedFat' ? 'Verz. vet (g)' : field === 'fiber' ? 'Vezels (g)' : 'Natrium (mg)'}
                    </label>
                    <input
                      type="number"
                      step={field === 'calories' || field === 'sodium' ? '1' : '0.1'}
                      value={manualMeal[field]}
                      onChange={(e) => setManualMeal({...manualMeal, [field]: e.target.value})}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* JSON Tab */}
        {tab === 'json' && (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-4">
            <textarea
              value={mealJson}
              onChange={(e) => setMealJson(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm h-64"
              placeholder='{"time": "12:00", "name": "Lunch", "calories": 500, ...}'
            />
          </div>
        )}

        {/* Templates Tab */}
        {tab === 'templates' && (
          <>
            {/* Search bar - Fixed */}
            <div className="flex-shrink-0 px-6 pt-3 pb-2">
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Zoek template..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Templates list - Scrollable */}
            <div className="flex-1 min-h-0 px-6 pb-4 overflow-y-auto">
              {/* Recent gebruikt */}
              {recentTemplates.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent gebruikt</h4>
                  <div className="space-y-2">
                    {recentTemplates.map(template => {
                      const totals = calculateTemplateTotals(template);
                      return (
                        <div key={template.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleLoadTemplate(template)}
                              className="flex-1 text-left"
                            >
                              <div className="font-semibold text-gray-800">{template.name}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {template.category} • {template.products.length} producten
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                {totals.calories} kcal • {totals.protein.toFixed(1)}g eiwit
                              </div>
                            </button>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => toggleFavorite(template.id!)}
                                className="text-lg hover:scale-110 transition"
                                aria-label="Toggle favorite"
                              >
                                {template.isFavorite ? '⭐' : '☆'}
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id!)}
                                className="text-red-500 hover:text-red-700 text-lg"
                                aria-label="Verwijder template"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Favorieten */}
              {favoriteTemplates.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">⭐ Favorieten</h4>
                  <div className="space-y-2">
                    {favoriteTemplates.map(template => {
                      const totals = calculateTemplateTotals(template);
                      return (
                        <div key={template.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 hover:bg-yellow-100 transition">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleLoadTemplate(template)}
                              className="flex-1 text-left"
                            >
                              <div className="font-semibold text-gray-800">{template.name}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {template.category} • {template.products.length} producten
                              </div>
                              <div className="text-xs text-yellow-700 mt-1">
                                {totals.calories} kcal • {totals.protein.toFixed(1)}g eiwit
                              </div>
                            </button>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => toggleFavorite(template.id!)}
                                className="text-lg hover:scale-110 transition"
                                aria-label="Toggle favorite"
                              >
                                ⭐
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id!)}
                                className="text-red-500 hover:text-red-700 text-lg"
                                aria-label="Verwijder template"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Alle templates */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Alle templates</h4>
                {filteredTemplates.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="mb-2">Nog geen templates opgeslagen</p>
                    <p className="text-sm">Ga naar de Producten tab en klik op "Opslaan als template"</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTemplates.map(template => {
                      const totals = calculateTemplateTotals(template);
                      return (
                        <div key={template.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleLoadTemplate(template)}
                              className="flex-1 text-left"
                            >
                              <div className="font-semibold text-gray-800">{template.name}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {template.category} • {template.products.length} producten
                              </div>
                              <div className="text-xs text-gray-700 mt-1">
                                {totals.calories} kcal • {totals.protein.toFixed(1)}g eiwit
                              </div>
                            </button>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => toggleFavorite(template.id!)}
                                className="text-lg hover:scale-110 transition"
                                aria-label="Toggle favorite"
                              >
                                {template.isFavorite ? '⭐' : '☆'}
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id!)}
                                className="text-red-500 hover:text-red-700 text-lg"
                                aria-label="Verwijder template"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Footer - Sticky Action Buttons */}
        <div className="border-t bg-white p-4 rounded-b-xl flex-shrink-0">
          {tab === 'products' && (
            <div className="space-y-2">
              <button
                onClick={handleAddFromProducts}
                disabled={selectedProducts.length === 0}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                  selectedProducts.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isEditMode ? '✓ Opslaan' : '➕ Toevoegen'} {selectedProducts.length > 0 && `(${selectedProducts.length} ${selectedProducts.length === 1 ? 'product' : 'producten'})`}
              </button>
              {selectedProducts.length > 0 && !isEditMode && (
                <button
                  onClick={() => setShowSaveTemplateModal(true)}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
                >
                  💾 Opslaan als template
                </button>
              )}
            </div>
          )}
          {tab === 'manual' && (
            <button
              onClick={handleAddManually}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              {isEditMode ? '✓ Opslaan' : '➕ Toevoegen'}
            </button>
          )}
          {tab === 'json' && (
            <button
              onClick={handleImportJson}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              📥 Importeer JSON
            </button>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Template opslaan</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam template</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Bijv. Ontbijt standaard"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value as MealCategory)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="ontbijt">Ontbijt</option>
                  <option value="lunch">Lunch</option>
                  <option value="diner">Diner</option>
                  <option value="snack">Snack</option>
                  <option value="shake">Shake</option>
                  <option value="anders">Anders</option>
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 mb-1">Geselecteerde producten:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {selectedProducts.map(name => (
                    <li key={name}>• {name} ({productGrams[name] || 100}g)</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setNewTemplateName('');
                  setNewTemplateCategory('anders');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveAsTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Portion Modal */}
      {showAddPortionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nieuwe portie voor {addPortionForProduct}</h3>

            <AddPortionForm
              productName={addPortionForProduct}
              onSave={async (portion) => {
                await addPortion(portion);
                setShowAddPortionModal(false);
                setAddPortionForProduct('');
              }}
              onCancel={() => {
                setShowAddPortionModal(false);
                setAddPortionForProduct('');
              }}
            />
          </div>
        </div>
      )}
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
