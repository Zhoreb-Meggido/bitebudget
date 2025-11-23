/**
 * WaterIntakeCard - Daily water intake progress card for Dashboard
 * Shows total fluid intake (water + drinks) with circular progress indicator
 */

import React, { useMemo } from 'react';
import { useWaterEntries } from '@/hooks/useWaterEntries';
import { useEntries } from '@/hooks/useEntries';
import { useSettings } from '@/hooks/useSettings';
import { getTodayDate } from '@/utils';

interface Props {
  onAddWater: () => void;
}

export function WaterIntakeCard({ onAddWater }: Props) {
  const { getTotalWaterByDate } = useWaterEntries();
  const { getEntriesByDate } = useEntries();
  const { settings } = useSettings();

  const today = getTodayDate();

  // Calculate total fluid intake for today
  const fluidIntake = useMemo(() => {
    // Water entries
    const waterMl = getTotalWaterByDate(today);

    // Drink entries (mealType = 'drink')
    const drinkEntries = getEntriesByDate(today).filter(e => e.mealType === 'drink');
    const drinksMl = drinkEntries.reduce((total, entry) => {
      const totalGrams = entry.products?.reduce((sum, product) => sum + product.grams, 0) || 0;
      return total + totalGrams; // 1 gram ≈ 1 ml
    }, 0);

    return {
      waterMl,
      drinksMl,
      totalMl: waterMl + drinksMl,
    };
  }, [getTotalWaterByDate, getEntriesByDate, today]);

  const goal = settings.waterGoalMl;
  const percentage = Math.min(100, Math.round((fluidIntake.totalMl / goal) * 100));

  // Calculate circle progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          💧 Vochtinname
        </h3>
        <button
          onClick={onAddWater}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Toevoegen
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Circular Progress */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              className="text-cyan-500 transition-all duration-500"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {percentage}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              van {goal}ml
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {fluidIntake.totalMl}ml
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Totaal vandaag
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">🚰 Water</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {fluidIntake.waterMl}ml
              </span>
            </div>
            {fluidIntake.drinksMl > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">🥤 Dranken</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {fluidIntake.drinksMl}ml
                </span>
              </div>
            )}
          </div>

          {/* Progress bar (alternative visualization) */}
          <div className="pt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>0ml</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span>{goal}ml</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
