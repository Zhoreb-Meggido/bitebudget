import { useState, useEffect } from 'react';
import type { Product } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null; // null = add new, otherwise edit
  onSave: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
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

  // Load product data when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        brand: product.brand || '',
        calories: product.calories.toString(),
        protein: product.protein.toString(),
        carbohydrates: product.carbohydrates?.toString() || '',
        sugars: product.sugars?.toString() || '',
        fat: product.fat.toString(),
        saturatedFat: product.saturatedFat?.toString() || '',
        fiber: product.fiber?.toString() || '',
        sodium: product.sodium?.toString() || '',
        favorite: product.favorite || false,
      });
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
  }, [product]);

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
        calories: parseFloat(formData.calories) || 0,
        protein: parseFloat(formData.protein) || 0,
        carbohydrates: parseFloat(formData.carbohydrates) || undefined,
        sugars: parseFloat(formData.sugars) || undefined,
        fat: parseFloat(formData.fat) || 0,
        saturatedFat: parseFloat(formData.saturatedFat) || undefined,
        fiber: parseFloat(formData.fiber) || undefined,
        sodium: parseInt(formData.sodium) || undefined,
        favorite: formData.favorite,
      });
      onClose();
    } catch (error: any) {
      alert(error.message || 'Fout bij opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Product Bewerken' : 'Nieuw Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name & Brand */}
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
                Merk
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Calories & Protein */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calorieën (per 100g/ml) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.calories}
                onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eiwit (g) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.protein}
                onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Carbs & Sugars */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Koolhydraten (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.carbohydrates}
                onChange={(e) => setFormData(prev => ({ ...prev, carbohydrates: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suikers (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.sugars}
                onChange={(e) => setFormData(prev => ({ ...prev, sugars: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Fat & Saturated Fat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vet (g) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.fat}
                onChange={(e) => setFormData(prev => ({ ...prev, fat: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verzadigd Vet (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.saturatedFat}
                onChange={(e) => setFormData(prev => ({ ...prev, saturatedFat: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Fiber & Sodium */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vezels (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.fiber}
                onChange={(e) => setFormData(prev => ({ ...prev, fiber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Natrium (mg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="1"
                value={formData.sodium}
                onChange={(e) => setFormData(prev => ({ ...prev, sodium: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Favorite */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.favorite}
                onChange={(e) => setFormData(prev => ({ ...prev, favorite: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Favoriet</span>
            </label>
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
