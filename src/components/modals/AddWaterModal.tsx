/**
 * AddWaterModal - Quick-add water intake modal
 * Preset buttons for common amounts + custom input
 */

import React, { useState } from 'react';
import { useWaterEntries } from '@/hooks/useWaterEntries';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  date?: string; // Optional: defaults to today
}

export function AddWaterModal({ isOpen, onClose, date }: Props) {
  const { addWaterEntry } = useWaterEntries();
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const presetAmounts = [
    { label: '250ml', value: 250, icon: '🥤' },
    { label: '500ml', value: 500, icon: '🧃' },
    { label: '750ml', value: 750, icon: '🍶' },
    { label: '1L', value: 1000, icon: '💧' },
  ];

  const handleAddWater = async (amount: number) => {
    if (amount <= 0) {
      alert('Voer een geldig aantal ml in');
      return;
    }

    setIsAdding(true);
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const timestamp = Date.now();

      await addWaterEntry({
        date: targetDate,
        timestamp,
        amount,
      });

      console.log(`✓ ${amount}ml water toegevoegd 💧`);
      setCustomAmount('');
      onClose();
    } catch (error) {
      console.error('Failed to add water:', error);
      alert('Kan water niet toevoegen');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('Voer een geldig aantal ml in');
      return;
    }
    handleAddWater(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            💧 Water toevoegen
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Sluiten"
          >
            <span className="text-2xl text-gray-500 dark:text-gray-400">×</span>
          </button>
        </div>

        {/* Preset Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {presetAmounts.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleAddWater(preset.value)}
              disabled={isAdding}
              className="flex flex-col items-center justify-center px-6 py-4 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="text-3xl mb-1">{preset.icon}</span>
              <span className="text-lg font-semibold">{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Of voer een andere hoeveelheid in
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="ml"
                min="1"
                max="5000"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={isAdding}
              />
              <button
                type="submit"
                disabled={isAdding || !customAmount}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Bezig...' : 'Toevoegen'}
              </button>
            </div>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> Water en andere caloriearme dranken (thee, koffie, cola zero) voeg je hier toe.
            Calorie-rijke dranken voeg je toe als maaltijd met type "Drank".
          </p>
        </div>
      </div>
    </div>
  );
}
