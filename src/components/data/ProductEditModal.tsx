import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { useModalLock } from '@/contexts/ModalStateContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null; // null = add new, otherwise edit
  onSave: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

/**
 * Parse a number string that might use comma or dot as decimal separator
 * Examples: "1,2" -> 1.2, "1.2" -> 1.2, "1" -> 1
 */
function parseDecimal(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Replace comma with dot for parseFloat compatibility
  return parseFloat(value.replace(',', '.')) || 0;
}

/**
 * Parse optional number - returns undefined for empty values, 0 for "0"
 */
function parseOptionalDecimal(value: string): number | undefined {
  if (!value || value.trim() === '') return undefined;
  const parsed = parseFloat(value.replace(',', '.'));
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Parse optional integer - returns undefined for empty values, 0 for "0"
 */
function parseOptionalInt(value: string): number | undefined {
  if (!value || value.trim() === '') return undefined;
  const parsed = parseInt(value.replace(',', '.'));
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Convert a number to string with dot as decimal separator (not comma)
 * This ensures the HTML input receives a valid format regardless of locale
 */
function toDecimalString(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  // Use toFixed to ensure proper decimal format, then remove trailing zeros
  return value.toString().replace(',', '.');
}

export function ProductEditModal({ isOpen, onClose, product, onSave }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    calories: '',
    protein: '',
    carbohydrates: '',
    sugars: '',
    fat: '',
    saturatedFat: '',
    fiber: '',
    sodium: '',
    favorite: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { markDirty, markClean } = useModalLock('product-edit-modal');

  // Load product data when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        brand: product.brand || '',
        calories: toDecimalString(product.calories),
        protein: toDecimalString(product.protein),
        carbohydrates: toDecimalString(product.carbohydrates),
        sugars: toDecimalString(product.sugars),
        fat: toDecimalString(product.fat),
        saturatedFat: toDecimalString(product.saturatedFat),
        fiber: toDecimalString(product.fiber),
        sodium: toDecimalString(product.sodium),
        favorite: product.favorite || false,
      });
      markDirty(); // Mark modal as having unsaved changes when editing
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        brand: '',
        calories: '',
        protein: '',
        carbohydrates: '',
        sugars: '',
        fat: '',
        saturatedFat: '',
        fiber: '',
        sodium: '',
        favorite: false,
      });
    }
  }, [product, markDirty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Productnaam is verplicht');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        brand: formData.brand.trim() || undefined,
        calories: parseDecimal(formData.calories),
        protein: parseDecimal(formData.protein),
        carbohydrates: parseOptionalDecimal(formData.carbohydrates) ?? 0,
        sugars: parseOptionalDecimal(formData.sugars) ?? 0,
        fat: parseDecimal(formData.fat),
        saturatedFat: parseOptionalDecimal(formData.saturatedFat) ?? 0,
        fiber: parseOptionalDecimal(formData.fiber) ?? 0,
        sodium: parseOptionalInt(formData.sodium) ?? 0,
        favorite: formData.favorite,
        source: product?.source || 'manual', // Preserve source when editing, default to 'manual' when adding
      });
      markClean(); // Clear dirty state before closing
      onClose();
    } catch (error: any) {
      alert(error.message || 'Fout bij opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    markClean();
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    markDirty(); // Mark as dirty on any change
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {product ? 'Product Bewerken' : 'Nieuw Product'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Naam
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Merk
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Calories & Protein */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Calorieën (per 100g/ml)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.calories}
                onChange={(e) => handleChange('calories', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Eiwit (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.protein}
                onChange={(e) => handleChange('protein', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Carbs & Sugars */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Koolhydraten (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.carbohydrates}
                onChange={(e) => handleChange('carbohydrates', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Suikers (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.sugars}
                onChange={(e) => handleChange('sugars', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Fat & Saturated Fat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vet (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.fat}
                onChange={(e) => handleChange('fat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Verzadigd Vet (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.saturatedFat}
                onChange={(e) => handleChange('saturatedFat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Fiber & Sodium */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vezels (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.fiber}
                onChange={(e) => handleChange('fiber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Natrium (mg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="1"
                value={formData.sodium}
                onChange={(e) => handleChange('sodium', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Favorite */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.favorite}
                onChange={(e) => handleChange('favorite', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Favoriet</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
