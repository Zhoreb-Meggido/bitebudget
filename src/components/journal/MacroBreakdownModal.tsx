/**
 * MacroBreakdownModal - Shows breakdown of which products contributed to a macro
 */

import React from 'react';
import type { Entry } from '@/types';
import { useProducts } from '@/hooks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entries: Entry[];
  macroType: 'calories' | 'protein' | 'carbohydrates' | 'sugars' | 'fat' | 'saturatedFat' | 'fiber' | 'sodium';
  macroLabel: string;
  totalValue: number;
  unit: string;
}

export function MacroBreakdownModal({ isOpen, onClose, entries, macroType, macroLabel, totalValue, unit }: Props) {
  const { products } = useProducts();

  if (!isOpen) return null;

  // Calculate contribution per entry - need to expand entries with multiple products
  const breakdown = entries.flatMap(entry => {
    // If entry has products array, process each product separately
    if (entry.products && entry.products.length > 0) {
      return entry.products.map(productInEntry => {
        const product = products.find(p => p.name === productInEntry.name);
        if (!product) {
          console.log(`⚠️ Product not found: ${productInEntry.name}`);
          return {
            entry: {
              ...entry,
              name: productInEntry.name,
              grams: productInEntry.grams,
            },
            value: 0,
            percentage: 0,
          };
        }

        // Calculate nutrition based on grams
        const multiplier = productInEntry.grams / 100; // Products are per 100g
        let value = 0;

        switch (macroType) {
          case 'calories':
            value = (product.calories || 0) * multiplier;
            break;
          case 'protein':
            value = (product.protein || 0) * multiplier;
            break;
          case 'carbohydrates':
            value = (product.carbohydrates || 0) * multiplier;
            break;
          case 'sugars':
            value = (product.sugars || 0) * multiplier;
            break;
          case 'fat':
            value = (product.fat || 0) * multiplier;
            break;
          case 'saturatedFat':
            value = (product.saturatedFat || 0) * multiplier;
            break;
          case 'fiber':
            value = (product.fiber || 0) * multiplier;
            break;
          case 'sodium':
            value = (product.sodium || 0) * multiplier;
            break;
        }

        const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

        return {
          entry: {
            ...entry,
            name: productInEntry.name,
            grams: productInEntry.grams,
          },
          value,
          percentage,
        };
      });
    }

    // Fallback for old-style entries without products array (shouldn't happen anymore)
    return [];
  }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  console.log(`📊 Breakdown for ${macroLabel}:`, {
    totalEntries: entries.length,
    totalProducts: products.length,
    breakdownItems: breakdown.length,
    breakdown: breakdown.map(b => ({ name: b.entry.name, value: b.value, percentage: b.percentage }))
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{macroLabel} Breakdown</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Totaal: <span className="font-semibold">{macroType === 'calories' || macroType === 'sodium' ? Math.round(totalValue) : totalValue.toFixed(1)}{unit}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {breakdown.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Geen gegevens beschikbaar
            </div>
          ) : (
            <div className="space-y-3">
              {breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {item.entry.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.entry.grams}g • {item.entry.time}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        {macroType === 'calories' || macroType === 'sodium' ? Math.round(item.value) : item.value.toFixed(1)}{unit}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-500 dark:bg-blue-600 transition-all"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
