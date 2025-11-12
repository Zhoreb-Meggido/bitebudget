/**
 * AddMealModal - Modal voor maaltijd toevoegen (3 tabs: producten/handmatig/JSON)
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Entry, MealTemplate, MealCategory, ProductPortion } from '@/types';
import { getCurrentTime, calculateProductNutrition, roundNutritionValues } from '@/utils';
import { useTemplates, usePortions, useDebounce } from '@/hooks';

/**
 * Parse a number string that might use comma or dot as decimal separator
 * Examples: "1,2" -> 1.2, "1.2" -> 1.2, "1" -> 1
 */
function parseDecimal(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Replace comma with dot for parseFloat compatibility
  return parseFloat(value.replace(',', '.')) || 0;
}

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
  const [selectedProducts, setSelectedProducts] = useState<Array<number | string>>([]); // Product IDs
  const [productGrams, setProductGrams] = useState<Record<number | string, number>>({});
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

  // Debounce search terms to reduce filtering on every keystroke
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const debouncedTemplateSearch = useDebounce(templateSearch, 300);

  // Portions state
  const { portions: allPortions, addPortion } = usePortions();
  const [productPortions, setProductPortions] = useState<Record<number | string, ProductPortion[]>>({});
  const [showAddPortionModal, setShowAddPortionModal] = useState(false);
  const [addPortionForProduct, setAddPortionForProduct] = useState<string>(''); // Still use name for portions

  // Load portions for selected products
  useEffect(() => {
    const loadPortionsForProducts = async () => {
      const portionsMap: Record<number | string, ProductPortion[]> = {};
      for (const prodId of selectedProducts) {
        const product = products.find(p => p.id === prodId);
        if (product) {
          const prodPortions = allPortions.filter(p => p.productName === product.name);
          portionsMap[prodId] = prodPortions;
        }
      }
      setProductPortions(portionsMap);
    };
    loadPortionsForProducts();
  }, [selectedProducts, allPortions, products]);

  // Load quick add template when provided
  useEffect(() => {
    if (quickAddTemplate && isOpen && !editEntry) {
      // Load template products into products tab - convert names to IDs
      const prodIds: Array<number | string> = [];
      const grams: Record<number | string, number> = {};

      quickAddTemplate.products.forEach(tp => {
        const product = products.find(p => p.name === tp.name);
        if (product && product.id) {
          prodIds.push(product.id);
          grams[product.id] = tp.grams;
        }
      });

      setSelectedProducts(prodIds);
      setProductGrams(grams);
      setMealTime(getCurrentTime());
      setTab('products'); // Open on products tab for adjustments
    }
  }, [quickAddTemplate, isOpen, editEntry, products]);

  // Load entry data when editing
  useEffect(() => {
    if (editEntry && isOpen) {
      // Check if entry has products array - use products tab
      if (editEntry.products && Array.isArray(editEntry.products) && editEntry.products.length > 0) {
        setTab('products');
        setMealTime(editEntry.time);

        // Convert product names to IDs
        const prodIds: Array<number | string> = [];
        const grams: Record<number | string, number> = {};
        editEntry.products.forEach(ep => {
          const product = products.find(p => p.name === ep.name);
          if (product && product.id) {
            prodIds.push(product.id);
            grams[product.id] = ep.grams;
          }
        });
        setSelectedProducts(prodIds);
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
  }, [editEntry, isOpen, products]);

  // Sort products: selected first, then favorites, then alphabetical
  // Memoized for performance with debounced search
  const sortedProducts = useMemo(() =>
    products
      .filter(p => debouncedProductSearch === '' || p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase()))
      .sort((a, b) => {
        const aSelected = a.id && selectedProducts.includes(a.id);
        const bSelected = b.id && selectedProducts.includes(b.id);

        // 1. Selected items first
        if (aSelected !== bSelected) return aSelected ? -1 : 1;

        // 2. Then favorites
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;

        // 3. Then alphabetical
        return a.name.localeCompare(b.name);
      }),
    [products, debouncedProductSearch, selectedProducts]
  );

  const filteredTemplates = useMemo(() =>
    templates
      .filter(t => debouncedTemplateSearch === '' || t.name.toLowerCase().includes(debouncedTemplateSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [templates, debouncedTemplateSearch]
  );

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

    selectedProducts.forEach(prodId => {
      const product = products.find(p => p.id === prodId);
      if (!product) return;
      const grams = productGrams[prodId] || 100;
      const nutrition = calculateProductNutrition(product, grams);

      totals.calories += nutrition.calories;
      totals.protein += nutrition.protein;
      totals.carbohydrates += nutrition.carbohydrates;
      totals.sugars += nutrition.sugars;
      totals.fat += nutrition.fat;
      totals.saturatedFat += nutrition.saturatedFat;
      totals.fiber += nutrition.fiber;
      totals.sodium += nutrition.sodium;

      productDetails.push({ name: product.name, grams });
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
      calories: parseInt(manualMeal.calories.replace(',', '.')) || 0,
      protein: parseDecimal(manualMeal.protein),
      carbohydrates: parseDecimal(manualMeal.carbohydrates),
      sugars: parseDecimal(manualMeal.sugars),
      fat: parseDecimal(manualMeal.fat),
      saturatedFat: parseDecimal(manualMeal.saturatedFat),
      fiber: parseDecimal(manualMeal.fiber),
      sodium: parseInt(manualMeal.sodium.replace(',', '.')) || 0,
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
        calories: parseInt(String(data.calories).replace(',', '.')) || 0,
        protein: parseDecimal(String(data.protein)),
        carbohydrates: parseDecimal(String(data.carbohydrates)),
        sugars: parseDecimal(String(data.sugars)),
        fat: parseDecimal(String(data.fat)),
        saturatedFat: parseDecimal(String(data.saturatedFat)),
        fiber: parseDecimal(String(data.fiber)),
        sodium: parseInt(String(data.sodium).replace(',', '.')) || 0,
      });
      resetForm();
    } catch (e) {
      alert('Ongeldige JSON');
    }
  };

  // Template handlers
  const handleLoadTemplate = async (template: MealTemplate) => {
    // Load template products into products tab - convert names to IDs
    const prodIds: Array<number | string> = [];
    const grams: Record<number | string, number> = {};
    template.products.forEach(tp => {
      const product = products.find(p => p.name === tp.name);
      if (product && product.id) {
        prodIds.push(product.id);
        grams[product.id] = tp.grams;
      }
    });

    setSelectedProducts(prodIds);
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
    selectedProducts.forEach(prodId => {
      const product = products.find(p => p.id === prodId);
      if (!product) return;
      const grams = productGrams[prodId] || 100;
      productDetails.push({ name: product.name, grams });
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-white border-b px-4 py-3 flex justify-between items-center rounded-t-xl flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">{isEditMode ? 'Maaltijd bewerken' : 'Maaltijd toevoegen'}</h3>
          <button
            onClick={resetForm}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Sluiten"
          >✕</button>
        </div>

        {/* Tabs - Compact */}
        <div className="flex-shrink-0 px-4 pt-3">
          <div className="grid grid-cols-4 gap-1.5">
            {(['products', 'templates', 'manual', 'json'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-2 py-1.5 rounded-lg font-medium transition text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 min-h-[44px] ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <span className="text-base sm:text-lg">{t === 'products' ? '📦' : t === 'templates' ? '⭐' : t === 'manual' ? '✏️' : '📋'}</span>
                <span className="leading-tight">{t === 'products' ? 'Prod' : t === 'templates' ? 'Templ' : t === 'manual' ? 'Hand' : 'JSON'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Tab - Unified List */}
        {tab === 'products' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Search bar - Fixed */}
            <div className="flex-shrink-0 px-4 pt-3 pb-2">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="🔍 Zoek product..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            {/* Unified Products List - Selected items at top with inline editing */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
              {sortedProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">Geen producten gevonden</p>
              ) : (
                sortedProducts.map((product, idx) => {
                  if (!product.id) return null; // Skip products without ID
                  const isSelected = selectedProducts.includes(product.id);
                  const prevProduct = sortedProducts[idx - 1];
                  const prevSelected = prevProduct && prevProduct.id && selectedProducts.includes(prevProduct.id);
                  const showDivider = !isSelected && prevSelected;
                  const portions = productPortions[product.id] || [];
                  const hasPortions = portions.length > 0;

                  return (
                    <React.Fragment key={product.id}>
                      {/* Divider between selected and unselected */}
                      {showDivider && (
                        <div className="flex items-center gap-2 my-3 px-2">
                          <div className="flex-1 border-t-2 border-blue-300"></div>
                          <span className="text-xs text-gray-500 font-medium">Alle producten</span>
                          <div className="flex-1 border-t-2 border-blue-300"></div>
                        </div>
                      )}

                      <label
                        className={`flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition mb-1 ${
                          isSelected
                            ? 'bg-blue-50 border-2 border-blue-300'
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product.id!]);
                              if (!productGrams[product.id!]) {
                                setProductGrams({...productGrams, [product.id!]: 100});
                              }
                            } else {
                              setSelectedProducts(selectedProducts.filter(p => p !== product.id));
                            }
                          }}
                          className="w-5 h-5 mt-0.5 flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          {/* Product name */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {product.favorite && '⭐ '}
                              {product.name}
                              {product.brand && <span className="text-gray-500 text-xs"> ({product.brand})</span>}
                            </span>
                            {!isSelected && (
                              <span className="text-xs text-gray-500 flex-shrink-0">{product.calories} kcal</span>
                            )}
                          </div>

                          {/* Inline editing when selected */}
                          {isSelected && (
                            <div className="space-y-2 mt-2">
                              {/* First row: gram input + portion selector + delete button */}
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Gram input */}
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    value={productGrams[product.id!] ?? ''}
                                    onChange={(e) => setProductGrams({...productGrams, [product.id!]: parseInt(e.target.value) || 0})}
                                    onFocus={(e) => e.target.select()}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="100"
                                    className="w-20 px-3 py-2 border rounded-lg text-center text-sm min-h-[44px]"
                                    min="1"
                                  />
                                  <span className="text-sm text-gray-600 font-medium">g</span>
                                </div>

                                {/* Portion dropdown if available */}
                                {hasPortions && (
                                  <select
                                    value="custom"
                                    onChange={(e) => {
                                      const portionId = e.target.value;
                                      if (portionId === 'custom') return;
                                      if (portionId === 'new') {
                                        setAddPortionForProduct(product.name);
                                        setShowAddPortionModal(true);
                                        return;
                                      }
                                      const portion = portions.find(p => p.id?.toString() === portionId);
                                      if (portion) {
                                        setProductGrams({...productGrams, [product.id!]: portion.grams});
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-3 py-2 border rounded-lg text-xs min-h-[44px] bg-white"
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

                                {/* Add portion button if no portions */}
                                {!hasPortions && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setAddPortionForProduct(product.name);
                                      setShowAddPortionModal(true);
                                    }}
                                    className="px-3 py-2 text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap min-h-[44px] flex items-center"
                                  >
                                    + Portie
                                  </button>
                                )}

                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedProducts(selectedProducts.filter(p => p !== product.id));
                                    const newGrams = {...productGrams};
                                    delete newGrams[product.id!];
                                    setProductGrams(newGrams);
                                  }}
                                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 hover:text-red-800 text-lg"
                                  aria-label="Verwijder product"
                                >🗑️</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Manual Tab */}
        {tab === 'manual' && (
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tijd (optioneel)</label>
                <input
                  type="time"
                  value={manualMeal.time}
                  onChange={(e) => setManualMeal({...manualMeal, time: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Naam</label>
                <input
                  type="text"
                  value={manualMeal.name}
                  onChange={(e) => setManualMeal({...manualMeal, name: e.target.value})}
                  placeholder="Bijv. Lunch"
                  className="w-full px-4 py-2 border rounded-lg text-base min-h-[44px]"
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
                      inputMode="decimal"
                      step={field === 'calories' || field === 'sodium' ? '1' : '0.1'}
                      value={manualMeal[field]}
                      onChange={(e) => setManualMeal({...manualMeal, [field]: e.target.value})}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      className="w-full px-3 py-2 border rounded-lg min-h-[44px] text-base"
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
            <div className="flex-shrink-0 px-4 pt-3 pb-2">
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="🔍 Zoek template..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            {/* Templates list - Scrollable */}
            <div className="flex-1 min-h-0 px-4 pb-4 overflow-y-auto">
              {/* Recent gebruikt */}
              {recentTemplates.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent gebruikt</h4>
                  <div className="space-y-2">
                    {recentTemplates.map(template => {
                      const totals = calculateTemplateTotals(template);
                      return (
                        <div key={template.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => handleLoadTemplate(template)}
                              className="flex-1 text-left min-h-[44px] flex items-center"
                            >
                              <div>
                                <div className="font-semibold text-gray-800">{template.name}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {template.category} • {template.products.length} producten
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {totals.calories} kcal • {totals.protein.toFixed(1)}g eiwit
                                </div>
                              </div>
                            </button>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => toggleFavorite(template.id!)}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xl hover:scale-110 transition"
                                aria-label="Toggle favorite"
                              >
                                {template.isFavorite ? '⭐' : '☆'}
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id!)}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:text-red-700 text-xl"
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
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => handleLoadTemplate(template)}
                              className="flex-1 text-left min-h-[44px] flex items-center"
                            >
                              <div>
                                <div className="font-semibold text-gray-800">{template.name}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {template.category} • {template.products.length} producten
                                </div>
                                <div className="text-xs text-yellow-700 mt-1">
                                  {totals.calories} kcal • {totals.protein.toFixed(1)}g eiwit
                                </div>
                              </div>
                            </button>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => toggleFavorite(template.id!)}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xl hover:scale-110 transition"
                                aria-label="Toggle favorite"
                              >
                                ⭐
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id!)}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:text-red-700 text-xl"
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
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => handleLoadTemplate(template)}
                              className="flex-1 text-left min-h-[44px] flex items-center"
                            >
                              <div>
                                <div className="font-semibold text-gray-800">{template.name}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {template.category} • {template.products.length} producten
                                </div>
                                <div className="text-xs text-gray-700 mt-1">
                                  {totals.calories} kcal • {totals.protein.toFixed(1)}g eiwit
                                </div>
                              </div>
                            </button>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => toggleFavorite(template.id!)}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xl hover:scale-110 transition"
                                aria-label="Toggle favorite"
                              >
                                {template.isFavorite ? '⭐' : '☆'}
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id!)}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:text-red-700 text-xl"
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
        <div className="border-t bg-white px-4 py-3 rounded-b-xl flex-shrink-0">
          {tab === 'products' && (
            <div className="flex flex-col gap-2">
              {/* Mobile: vertical stack, Desktop (lg+): horizontal row with all 3 items */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                {/* Tijd input - compact on desktop */}
                <div className="flex items-center gap-2 lg:w-auto">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tijd:</label>
                  <input
                    type="time"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    placeholder={getCurrentTime()}
                    className="flex-1 lg:w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[44px]"
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {mealTime === '' && '(nu)'}
                  </span>
                </div>

                {/* Primary action button */}
                <button
                  onClick={handleAddFromProducts}
                  disabled={selectedProducts.length === 0}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition min-h-[44px] ${
                    selectedProducts.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isEditMode ? '✓ Opslaan' : '➕ Toevoegen'} {selectedProducts.length > 0 && `(${selectedProducts.length})`}
                </button>

                {/* Template button - same row on desktop (lg+), separate on mobile */}
                {selectedProducts.length > 0 && (
                  <button
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="lg:flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition min-h-[44px]"
                  >
                    💾 <span className="hidden lg:inline">Opslaan als </span>Template
                  </button>
                )}
              </div>
            </div>
          )}
          {tab === 'manual' && (
            <button
              onClick={handleAddManually}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 min-h-[50px]"
            >
              {isEditMode ? '✓ Opslaan' : '➕ Toevoegen'}
            </button>
          )}
          {tab === 'json' && (
            <button
              onClick={handleImportJson}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 min-h-[50px]"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base min-h-[44px]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value as MealCategory)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base min-h-[44px]"
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
                  {selectedProducts.map(prodId => {
                    const product = products.find(p => p.id === prodId);
                    if (!product) return null;
                    return (
                      <li key={prodId}>• {product.name} ({productGrams[prodId] || 100}g)</li>
                    );
                  })}
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
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 min-h-[44px]"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveAsTemplate}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 min-h-[44px]"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base min-h-[44px]"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hoeveelheid</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base min-h-[44px]"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Eenheid</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof unit)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base min-h-[44px]"
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
            inputMode="decimal"
            value={gramsPerUnit}
            onChange={(e) => setGramsPerUnit(e.target.value)}
            placeholder="Bijv. 35"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base min-h-[44px]"
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
          className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 min-h-[44px]"
        >
          Annuleren
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 min-h-[44px]"
        >
          Opslaan
        </button>
      </div>
    </div>
  );
}
