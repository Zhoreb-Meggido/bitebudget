import { useState, useEffect } from 'react';
import type { ProductPortion } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  portion: ProductPortion | null; // null = add new, otherwise edit
  productName: string; // The product this portion belongs to
  onSave: (data: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function PortionEditModal({ isOpen, onClose, portion, productName, onSave }: Props) {
  const [formData, setFormData] = useState({
    portionName: '',
    grams: '',
    isDefault: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load portion data when editing
  useEffect(() => {
    if (portion) {
      setFormData({
        portionName: portion.portionName,
        grams: portion.grams.toString(),
        isDefault: portion.isDefault || false,
      });
    } else {
      // Reset form for new portion
      setFormData({
        portionName: '',
        grams: '',
        isDefault: false,
      });
    }
  }, [portion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.portionName.trim()) {
      alert('Portienaam is verplicht');
      return;
    }

    if (!formData.grams || parseFloat(formData.grams) <= 0) {
      alert('Gram moet groter zijn dan 0');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        productName: productName,
        portionName: formData.portionName.trim(),
        grams: parseFloat(formData.grams),
        isDefault: formData.isDefault,
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {portion ? 'Portie Bewerken' : 'Nieuwe Portie'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Voor: {productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Portion Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portienaam *
            </label>
            <input
              type="text"
              value={formData.portionName}
              onChange={(e) => setFormData(prev => ({ ...prev, portionName: e.target.value }))}
              placeholder="bijv. Groot, Klein, Portie, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Grams */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gram *
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.grams}
              onChange={(e) => setFormData(prev => ({ ...prev, grams: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Default Checkbox */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Standaard portie</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Dit wordt de standaard portie bij het toevoegen van dit product
            </p>
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
