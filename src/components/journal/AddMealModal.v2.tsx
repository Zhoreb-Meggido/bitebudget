/**
 * AddMealModal V2 - Two-step flow with cart pattern
 * Step 1: Select products (left column on desktop, full screen on mobile)
 * Step 2: Review meal (right column on desktop, separate screen on mobile)
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Entry, MealTemplate, ProductPortion, MealType, MealCategory } from '@/types';
import { getCurrentTime, calculateProductNutrition, roundNutritionValues } from '@/utils';
import { useTemplates, usePortions, useDebounce } from '@/hooks';
import { useModalLock } from '@/contexts/ModalStateContext';

// Cart item - product with selected quantity
interface CartItem {
  product: Product;
  grams: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddMeal: (meal: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  products: Product[];
  selectedDate: string;
  editEntry?: Entry;
  onUpdateMeal?: (id: number | string, meal: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  quickAddTemplate?: MealTemplate | null;
}

type Tab = 'products' | 'templates';

export function AddMealModalV2({ isOpen, onClose, onAddMeal, products, selectedDate, editEntry, onUpdateMeal, quickAddTemplate }: Props) {
  const [step, setStep] = useState<1 | 2>(1); // 1 = select products, 2 = review meal
  const [tab, setTab] = useState<Tab>('products');
  const [cart, setCart] = useState<CartItem[]>([]); // Shopping cart
  const [mealTime, setMealTime] = useState('');
  const [mealType, setMealType] = useState<MealType | ''>('');
  const [productSearch, setProductSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<MealCategory>('anders');

  const { templates, recentTemplates, favoriteTemplates, trackUsage, addTemplate } = useTemplates();
  const { portions: allPortions } = usePortions();
  const { markDirty, markClean } = useModalLock('add-meal-modal-v2');

  const debouncedProductSearch = useDebounce(productSearch, 300);
  const debouncedTemplateSearch = useDebounce(templateSearch, 300);

  // Load quick add template when provided
  useEffect(() => {
    if (quickAddTemplate && isOpen && !editEntry) {
      const items: CartItem[] = [];
      quickAddTemplate.products.forEach(tp => {
        const product = products.find(p => p.name === tp.name);
        if (product) {
          items.push({ product, grams: tp.grams });
        }
      });
      setCart(items);
      setMealTime(getCurrentTime());
      setStep(2); // Go directly to review
      markDirty(); // Mark modal as having unsaved changes
    }
  }, [quickAddTemplate, isOpen, editEntry, products, markDirty]);

  // Load entry data when editing
  useEffect(() => {
    if (editEntry && isOpen) {
      if (editEntry.products && Array.isArray(editEntry.products) && editEntry.products.length > 0) {
        const items: CartItem[] = [];
        editEntry.products.forEach(ep => {
          const product = products.find(p => p.name === ep.name);
          if (product) {
            items.push({ product, grams: ep.grams });
          }
        });
        setCart(items);
        setMealTime(editEntry.time);
        setMealType(editEntry.mealType || '');
        setStep(2); // Go directly to review
        markDirty(); // Mark modal as having unsaved changes when editing
      }
    } else if (!isOpen) {
      // Reset when modal closes
      setStep(1);
      setTab('products');
      setCart([]);
      setMealTime('');
      setMealType('');
      setProductSearch('');
      setTemplateSearch('');
    }
  }, [editEntry, isOpen, products, markDirty]);

  const isEditMode = !!editEntry;

  // Sort products: favorites first, then alphabetical
  const sortedProducts = useMemo(() =>
    products
      .filter(p => debouncedProductSearch === '' ||
        p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase()) ||
        p.brand?.toLowerCase().includes(debouncedProductSearch.toLowerCase()))
      .sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [products, debouncedProductSearch]
  );

  const filteredTemplates = useMemo(() =>
    templates
      .filter(t => debouncedTemplateSearch === '' || t.name.toLowerCase().includes(debouncedTemplateSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [templates, debouncedTemplateSearch]
  );

  // Calculate meal totals
  const mealTotals = useMemo(() => {
    let totals = { calories: 0, protein: 0, carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 };
    cart.forEach(item => {
      const nutrition = calculateProductNutrition(item.product, item.grams);
      totals.calories += nutrition.calories;
      totals.protein += nutrition.protein;
      totals.carbohydrates += nutrition.carbohydrates;
      totals.sugars += nutrition.sugars;
      totals.fat += nutrition.fat;
      totals.saturatedFat += nutrition.saturatedFat;
      totals.fiber += nutrition.fiber;
      totals.sodium += nutrition.sodium;
    });
    return totals;
  }, [cart]);

  // Add product to cart
  const addToCart = (product: Product) => {
    // Check if already in cart
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex >= 0) {
      // Already in cart, just go to step 2 to edit
      setStep(2);
      return;
    }

    // Get default portion or use 100g
    const productPortions = allPortions.filter(p => p.productName === product.name);
    const defaultPortion = productPortions.find(p => p.isDefault);
    const grams = defaultPortion?.grams || 100;

    setCart([...cart, { product, grams }]);
    markDirty(); // Mark modal as having unsaved changes
  };

  // Load template into cart
  const loadTemplate = async (template: MealTemplate) => {
    const items: CartItem[] = [];
    template.products.forEach(tp => {
      const product = products.find(p => p.name === tp.name);
      if (product) {
        items.push({ product, grams: tp.grams });
      }
    });
    setCart(items);
    setMealTime(getCurrentTime());
    await trackUsage(template.id!);
    setStep(2);
    markDirty(); // Mark modal as having unsaved changes
  };

  // Save current cart as template
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Vul een naam in voor de template');
      return;
    }

    if (cart.length === 0) {
      alert('Selecteer minimaal 1 product');
      return;
    }

    const productDetails = cart.map(item => ({ name: item.product.name, grams: item.grams }));

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

  // Update cart item grams
  const updateCartItemGrams = (index: number, grams: number) => {
    const newCart = [...cart];
    newCart[index] = { ...newCart[index], grams };
    setCart(newCart);
    markDirty(); // Mark modal as having unsaved changes
  };

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
    markDirty(); // Mark modal as having unsaved changes
  };

  // Submit meal
  const handleSubmitMeal = async () => {
    if (cart.length === 0) return;

    const time = mealTime || getCurrentTime();
    const productDetails = cart.map(item => ({ name: item.product.name, grams: item.grams }));
    const name = productDetails.map(p => `${p.name} (${p.grams}g)`).join(' + ');

    const mealData = {
      date: selectedDate,
      time,
      name,
      products: productDetails,
      ...(mealType && { mealType }), // Only include mealType if set
      ...roundNutritionValues(mealTotals)
    };

    if (isEditMode && editEntry && onUpdateMeal) {
      await onUpdateMeal(editEntry.id!, mealData);
    } else {
      await onAddMeal(mealData);
    }

    markClean(); // Clear dirty state before closing
    onClose();
  };

  // Handle close (also clear dirty state)
  const handleClose = () => {
    markClean();
    onClose();
  };

  // Calculate template totals for display
  const calculateTemplateTotals = (template: MealTemplate) => {
    let totals = { calories: 0, protein: 0, carbohydrates: 0, sugars: 0, saturatedFat: 0, fiber: 0, sodium: 0 };
    template.products.forEach(({ name, grams }) => {
      const product = products.find(p => p.name === name);
      if (!product) return;
      const nutrition = calculateProductNutrition(product, grams);
      totals.calories += nutrition.calories;
      totals.protein += nutrition.protein;
      totals.carbohydrates += nutrition.carbohydrates;
      totals.sugars += nutrition.sugars;
      totals.saturatedFat += nutrition.saturatedFat;
      totals.fiber += nutrition.fiber;
      totals.sodium += nutrition.sodium;
    });
    return totals;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-start justify-center p-0 sm:p-4 sm:pt-8 z-50 overflow-y-auto">
      {/* Mobile: Full screen with step transitions */}
      {/* Desktop: Two column layout */}
      <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-auto sm:max-h-[calc(100vh-4rem)] sm:rounded-xl sm:shadow-2xl sm:max-w-6xl flex flex-col sm:flex-row overflow-hidden">

        {/* LEFT COLUMN / STEP 1: Product Selection (hidden on mobile when step=2) */}
        <div className={`flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700 ${step === 2 ? 'hidden sm:flex' : 'flex'}`}>
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {isEditMode ? 'Maaltijd bewerken' : 'Maaltijd toevoegen'}
            </h3>
            <button
              onClick={handleClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl sm:flex"
              aria-label="Sluiten"
            >✕</button>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 px-4 pt-3">
            <div className="grid grid-cols-2 gap-2">
              {(['products', 'templates'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 min-h-[44px] ${
                    tab === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{t === 'products' ? '📦' : '⭐'}</span>
                  <span>{t === 'products' ? 'Producten' : 'Templates'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Products Tab */}
          {tab === 'products' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Search */}
              <div className="flex-shrink-0 px-4 pt-3 pb-2">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="🔍 Zoek product..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-base text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Product List */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
                {sortedProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Geen producten gevonden</p>
                    {/* TODO: Add quick add product buttons here */}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sortedProducts.map(product => {
                      if (!product.id) return null;
                      const inCart = cart.some(item => item.product.id === product.id);

                      return (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className={`w-full text-left p-3 rounded-lg transition ${
                            inCart
                              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
                              : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                {product.favorite && '⭐'}
                                {inCart && '✓'}
                                {product.name}
                              </div>
                              {product.brand && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</div>
                              )}
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {product.calories} kcal • {product.protein}g eiw • {product.carbohydrates}g koolh • {product.sugars}g suik • {product.saturatedFat}g v.vet • {product.fiber}g vez • {product.sodium}mg natr
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {tab === 'templates' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Search */}
              <div className="flex-shrink-0 px-4 pt-3 pb-2">
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="🔍 Zoek template..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-base text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Template List */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
                {/* Recent */}
                {recentTemplates.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent gebruikt</h4>
                    <div className="space-y-2">
                      {recentTemplates.map(template => {
                        const totals = calculateTemplateTotals(template);
                        return (
                          <button
                            key={template.id}
                            onClick={() => loadTemplate(template)}
                            className="w-full text-left bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                          >
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{template.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {template.category} • {template.products.length} producten
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {totals.calories} kcal • {totals.protein.toFixed(1)}g eiw • {totals.carbohydrates.toFixed(1)}g koolh • {totals.sugars.toFixed(1)}g suik • {totals.saturatedFat.toFixed(1)}g v.vet • {totals.fiber.toFixed(1)}g vez • {totals.sodium.toFixed(0)}mg natr
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Favorites */}
                {favoriteTemplates.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">⭐ Favorieten</h4>
                    <div className="space-y-2">
                      {favoriteTemplates.map(template => {
                        const totals = calculateTemplateTotals(template);
                        return (
                          <button
                            key={template.id}
                            onClick={() => loadTemplate(template)}
                            className="w-full text-left bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
                          >
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{template.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {template.category} • {template.products.length} producten
                            </div>
                            <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                              {totals.calories} kcal • {totals.protein.toFixed(1)}g eiw • {totals.carbohydrates.toFixed(1)}g koolh • {totals.sugars.toFixed(1)}g suik • {totals.saturatedFat.toFixed(1)}g v.vet • {totals.fiber.toFixed(1)}g vez • {totals.sodium.toFixed(0)}mg natr
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All templates */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Alle templates</h4>
                  {filteredTemplates.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                      Nog geen templates opgeslagen
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredTemplates.map(template => {
                        const totals = calculateTemplateTotals(template);
                        return (
                          <button
                            key={template.id}
                            onClick={() => loadTemplate(template)}
                            className="w-full text-left bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                          >
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{template.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {template.category} • {template.products.length} producten
                            </div>
                            <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                              {totals.calories} kcal • {totals.protein.toFixed(1)}g eiw • {totals.carbohydrates.toFixed(1)}g koolh • {totals.sugars.toFixed(1)}g suik • {totals.saturatedFat.toFixed(1)}g v.vet • {totals.fiber.toFixed(1)}g vez • {totals.sodium.toFixed(0)}mg natr
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer - Cart summary (mobile only) */}
          <div className="sm:hidden flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <button
              onClick={() => setStep(2)}
              disabled={cart.length === 0}
              className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                cart.length === 0
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Bekijk maaltijd ({cart.length})
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN / STEP 2: Review Meal (Cart) */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900 ${step === 1 ? 'hidden sm:flex' : 'flex'}`}>
          {/* Header (mobile only) */}
          <div className="sm:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setStep(1)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
              aria-label="Terug"
            >
              ←
            </button>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex-1">Je maaltijd</h3>
          </div>

          {/* Desktop header */}
          <div className="hidden sm:block bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Je maaltijd</h3>
          </div>

          {/* Cart content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-2">Nog geen producten toegevoegd</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Selecteer producten om te beginnen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Time input */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tijd
                  </label>
                  <input
                    type="time"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    placeholder={getCurrentTime()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                  />
                  {mealTime === '' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Standaard: huidige tijd</p>
                  )}
                </div>

                {/* Meal Type dropdown */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type (optioneel)
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => {
                      setMealType(e.target.value as MealType | '');
                      markDirty();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Geen type</option>
                    <option value="breakfast">🍳 Ontbijt</option>
                    <option value="lunch">🥗 Lunch</option>
                    <option value="dinner">🍽️ Diner</option>
                    <option value="snack">🍿 Snack</option>
                    <option value="drink">🥤 Drank</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Markeer als 'Drank' om mee te tellen in vochtinname
                  </p>
                </div>

                {/* Cart items */}
                {cart.map((item, index) => {
                  const nutrition = calculateProductNutrition(item.product, item.grams);
                  const productPortions = allPortions.filter(p => p.productName === item.product.name);

                  return (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {item.product.name}
                          {item.product.brand && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({item.product.brand})</span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="min-w-[32px] min-h-[32px] flex items-center justify-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          aria-label="Verwijder"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={item.grams}
                          onChange={(e) => updateCartItemGrams(index, parseInt(e.target.value) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-center"
                          min="1"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">g</span>

                        {productPortions.length > 0 && (
                          <select
                            value="custom"
                            onChange={(e) => {
                              if (e.target.value === 'custom') return;
                              const portion = productPortions.find(p => p.id?.toString() === e.target.value);
                              if (portion) {
                                updateCartItemGrams(index, portion.grams);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-sm"
                          >
                            <option value="custom">Handmatig</option>
                            {productPortions.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.portionName} ({p.grams}g)
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {nutrition.calories} kcal • {nutrition.protein.toFixed(1)}g eiwit • {nutrition.carbohydrates.toFixed(1)}g koolh • {nutrition.fat.toFixed(1)}g vet
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - Totals and submit */}
          {cart.length > 0 && (
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              {/* Totals */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Totaal</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Calorieën:</span>
                    <span className="font-semibold ml-1 text-gray-900 dark:text-gray-100">{mealTotals.calories}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Eiwit:</span>
                    <span className="font-semibold ml-1 text-gray-900 dark:text-gray-100">{mealTotals.protein.toFixed(1)}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Koolh.:</span>
                    <span className="font-semibold ml-1 text-gray-900 dark:text-gray-100">{mealTotals.carbohydrates.toFixed(1)}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Vet:</span>
                    <span className="font-semibold ml-1 text-gray-900 dark:text-gray-100">{mealTotals.fat.toFixed(1)}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Vezels:</span>
                    <span className="font-semibold ml-1 text-gray-900 dark:text-gray-100">{mealTotals.fiber.toFixed(1)}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Natrium:</span>
                    <span className="font-semibold ml-1 text-gray-900 dark:text-gray-100">{mealTotals.sodium.toFixed(0)}mg</span>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmitMeal}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                ✓ {isEditMode ? 'Opslaan' : 'Maaltijd toevoegen'}
              </button>

              {/* Save as template button */}
              <button
                onClick={() => setShowSaveTemplateModal(true)}
                className="w-full mt-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition"
              >
                💾 Opslaan als template
              </button>

              {/* Back button (mobile only) */}
              <button
                onClick={() => setStep(1)}
                className="sm:hidden w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                ← Meer producten toevoegen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Template opslaan</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Naam template</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Bijv. Ontbijt standaard"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-base min-h-[44px] text-gray-900 dark:text-gray-100"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categorie</label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value as MealCategory)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-base min-h-[44px] text-gray-900 dark:text-gray-100"
                >
                  <option value="ontbijt">Ontbijt</option>
                  <option value="lunch">Lunch</option>
                  <option value="diner">Diner</option>
                  <option value="snack">Snack</option>
                  <option value="shake">Shake</option>
                  <option value="anders">Anders</option>
                </select>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Geselecteerde producten:</p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {cart.map((item, index) => (
                    <li key={index}>• {item.product.name} ({item.grams}g)</li>
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
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 min-h-[44px]"
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
    </div>
  );
}
