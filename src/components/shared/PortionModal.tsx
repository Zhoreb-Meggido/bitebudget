import { useState, useEffect } from 'react';
import type { ProductPortion } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  portion: ProductPortion | null; // null = add new, otherwise edit
  productName: string;
  onSave: (data: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function PortionModal({ isOpen, onClose, portion, productName, onSave }: Props) {
  const [portionName, setPortionName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'g' | 'ml' | 'stuks' | 'el' | 'tl'>('g');
  const [gramsPerUnit, setGramsPerUnit] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load portion data when editing
  useEffect(() => {
    if (portion) {
      setPortionName(portion.portionName);
      setAmount(portion.amount?.toString() || '');
      setUnit(portion.unit || 'g');
      setGramsPerUnit(portion.gramsPerUnit?.toString() || '');
      setIsDefault(portion.isDefault || false);
    } else {
      // Reset form for new portion
      setPortionName('');
      setAmount('');
      setUnit('g');
      setGramsPerUnit('');
      setIsDefault(false);
    }
  }, [portion, isOpen]);

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
    if (grams <= 0) {
      alert('Gram moet groter zijn dan 0');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        productName,
        portionName: portionName.trim(),
        amount: parseInt(amount),
        unit,
        gramsPerUnit: unit === 'stuks' ? parseInt(gramsPerUnit) : undefined,
        grams,
        isDefault,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {portion ? 'Portie Bewerken' : 'Nieuwe Portie'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Voor: {productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Portion Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Portienaam *
            </label>
            <input
              type="text"
              value={portionName}
              onChange={(e) => setPortionName(e.target.value)}
              placeholder="Bijv. 1 snee, 1 kop"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Amount and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hoeveelheid *
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Eenheid *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as typeof unit)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="g">gram (g)</option>
                <option value="ml">milliliter (ml)</option>
                <option value="stuks">stuks</option>
                <option value="el">eetlepel (el)</option>
                <option value="tl">theelepel (tl)</option>
              </select>
            </div>
          </div>

          {/* Grams per unit (only for 'stuks') */}
          {unit === 'stuks' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grammen per stuk *
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={gramsPerUnit}
                onChange={(e) => setGramsPerUnit(e.target.value)}
                placeholder="Bijv. 35"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
          )}

          {/* Total grams display */}
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Totaal: <span className="font-semibold">{calculateGrams()}g</span>
            </p>
          </div>

          {/* Default Checkbox */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Standaard portie</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Dit wordt de standaard portie bij het toevoegen van dit product
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuleren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
