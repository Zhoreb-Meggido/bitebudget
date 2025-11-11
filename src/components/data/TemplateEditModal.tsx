import { useState, useEffect } from 'react';
import { useProducts, usePortions } from '@/hooks';
import type { MealTemplate, ProductInEntry } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template: MealTemplate | null; // null = add new, otherwise edit
  onSave: (data: Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function TemplateEditModal({ isOpen, onClose, template, onSave }: Props) {
  const { products: allProducts, isLoading: productsLoading } = useProducts();
  const { portions: allPortions } = usePortions();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    isFavorite: false,
  });
  const [templateProducts, setTemplateProducts] = useState<ProductInEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load template data when editing
  useEffect(() => {
    if (isOpen && template) {
      setFormData({
        name: template.name,
        category: template.category || '',
        isFavorite: template.isFavorite || false,
      });
      setTemplateProducts(template.products || []);
    } else if (isOpen && !template) {
      // Reset form for new template
      setFormData({
        name: '',
        category: '',
        isFavorite: false,
      });
      setTemplateProducts([]);
    }
  }, [template, isOpen]);

  const handleAddItem = () => {
    setTemplateProducts([...templateProducts, { name: '', grams: 0, portionName: undefined }]);
  };

  const handleRemoveItem = (index: number) => {
    setTemplateProducts(templateProducts.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProductInEntry, value: any) => {
    const newProducts = [...templateProducts];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setTemplateProducts(newProducts);
  };

  const handleProductSelect = (index: number, productName: string) => {
    const newProducts = [...templateProducts];
    newProducts[index].name = productName;

    // Check if product has portions and auto-select default
    const productPortions = allPortions.filter(p => p.productName === productName);
    const defaultPortion = productPortions.find(p => p.isDefault);

    if (defaultPortion) {
      newProducts[index].portionName = defaultPortion.portionName;
      newProducts[index].grams = defaultPortion.grams;
    } else {
      // Clear portion if product changes
      newProducts[index].portionName = undefined;
      if (newProducts[index].grams === 0) {
        newProducts[index].grams = 100; // Default to 100g
      }
    }

    setTemplateProducts(newProducts);
  };

  const handlePortionSelect = (index: number, portionName: string) => {
    const product = templateProducts[index];
    const portion = allPortions.find(
      p => p.productName === product.name && p.portionName === portionName
    );

    if (portion) {
      const newProducts = [...templateProducts];
      newProducts[index].portionName = portionName;
      newProducts[index].grams = portion.grams;
      setTemplateProducts(newProducts);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Template naam is verplicht');
      return;
    }

    if (templateProducts.length === 0) {
      alert('Voeg minimaal 1 product toe aan de template');
      return;
    }

    // Validate all products have name and grams
    for (let i = 0; i < templateProducts.length; i++) {
      if (!templateProducts[i].name) {
        alert(`Product ${i + 1}: Selecteer een product`);
        return;
      }
      if (!templateProducts[i].grams || templateProducts[i].grams <= 0) {
        alert(`Product ${i + 1}: Voer een geldig aantal gram in`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        category: formData.category.trim() as any || undefined,
        isFavorite: formData.isFavorite,
        products: templateProducts,
      });
      onClose();
    } catch (error: any) {
      alert(error.message || 'Fout bij opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Show loading if products haven't loaded yet
  if (productsLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center text-gray-500">Producten laden...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {template ? 'Template Bewerken' : 'Nieuwe Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Naam *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categorie
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="bijv. Ontbijt, Lunch, Diner"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Favorite */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFavorite}
                onChange={(e) => setFormData(prev => ({ ...prev, isFavorite: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Favoriet</span>
            </label>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                + Item toevoegen
              </button>
            </div>

            {templateProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                Geen producten. Klik op "+ Item toevoegen" om te beginnen.
              </div>
            ) : (
              <div className="space-y-3">
                {templateProducts.map((product, index) => {
                  const productPortions = allPortions.filter(p => p.productName === product.name);
                  const hasPortions = productPortions.length > 0;

                  return (
                    <div key={index} className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          {/* Product Select */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Product *
                            </label>
                            <select
                              value={product.name}
                              onChange={(e) => handleProductSelect(index, e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">-- Selecteer product --</option>
                              {allProducts.map(p => (
                                <option key={p.id} value={p.name}>
                                  {p.favorite && '⭐ '}{p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Portion Select (if available) & Grams */}
                          <div className="grid grid-cols-2 gap-2">
                            {hasPortions && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Portie
                                </label>
                                <select
                                  value={product.portionName || 'custom'}
                                  onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                      handleItemChange(index, 'portionName', undefined);
                                    } else {
                                      handlePortionSelect(index, e.target.value);
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="custom">Handmatig</option>
                                  {productPortions.map(p => (
                                    <option key={p.id} value={p.portionName}>
                                      {p.isDefault && '⭐ '}{p.portionName} ({p.grams}g)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className={hasPortions ? '' : 'col-span-2'}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Gram *
                              </label>
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                value={product.grams || ''}
                                onChange={(e) => handleItemChange(index, 'grams', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="mt-6 text-red-600 hover:bg-red-50 rounded text-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Verwijder product"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
