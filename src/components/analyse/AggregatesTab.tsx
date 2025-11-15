/**
 * AggregatesTab - Weekly and Monthly Aggregate Views
 *
 * Provides overview of nutrition and activity data aggregated by week or month.
 * Allows comparing different time periods and exporting data.
 */

import React, { useState, useMemo } from 'react';
import { useAggregates } from '@/hooks/useAggregates';
import type { AggregatePeriod } from '@/types';

type AggregateView = 'week' | 'month' | 'compare';

export function AggregatesTab() {
  const [activeView, setActiveView] = useState<AggregateView>('week');
  const [selectedPeriod, setSelectedPeriod] = useState<AggregatePeriod>('12weeks');

  const { weeklyAggregates, monthlyAggregates, isLoading } = useAggregates({
    period: selectedPeriod,
    includeActivity: true,
  });

  // Period options for dropdown
  const periodOptions: { value: AggregatePeriod; label: string }[] = [
    { value: '4weeks', label: 'Laatste 4 weken' },
    { value: '8weeks', label: 'Laatste 8 weken' },
    { value: '12weeks', label: 'Laatste 12 weken' },
    { value: '6months', label: 'Laatste 6 maanden' },
    { value: '12months', label: 'Laatste 12 maanden' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            Week & Maand Overzicht
          </h2>

          {/* Period selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="period-select" className="text-sm font-medium text-gray-700">
              Periode:
            </label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as AggregatePeriod)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-2 mt-4 border-b border-gray-200">
          <button
            onClick={() => setActiveView('week')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'week'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Per Week
          </button>
          <button
            onClick={() => setActiveView('month')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'month'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Per Maand
          </button>
          <button
            onClick={() => setActiveView('compare')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'compare'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Vergelijk
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Gegevens laden...</p>
        </div>
      )}

      {/* Content area */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeView === 'week' && (
            <WeekView aggregates={weeklyAggregates} />
          )}
          {activeView === 'month' && (
            <MonthView aggregates={monthlyAggregates} />
          )}
          {activeView === 'compare' && (
            <CompareView weeklyAggregates={weeklyAggregates} />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * WeekView - Display weekly aggregates
 * TODO: Implement in Phase 2
 */
function WeekView({ aggregates }: { aggregates: any[] }) {
  if (aggregates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Geen data beschikbaar voor de geselecteerde periode.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {aggregates.length} weken gevonden
      </p>

      {/* Placeholder - will be implemented in next phase */}
      <div className="grid gap-4">
        {aggregates.slice(0, 3).map((week, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900">
              Week {week.weekNumber}, {week.year}
            </div>
            <div className="text-sm text-gray-600">
              {week.weekStart} tot {week.weekEnd}
            </div>
            <div className="mt-2 text-sm text-gray-700">
              {week.daysTracked} dagen geregistreerd
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Ø Calorieën:</span>{' '}
                <span className="font-medium">{week.nutrition.avgCalories}</span>
              </div>
              <div>
                <span className="text-gray-600">Ø Eiwit:</span>{' '}
                <span className="font-medium">{week.nutrition.avgProtein}g</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
        📊 Gedetailleerde week weergave wordt geïmplementeerd in de volgende fase.
      </div>
    </div>
  );
}

/**
 * MonthView - Display monthly aggregates
 * TODO: Implement in Phase 2
 */
function MonthView({ aggregates }: { aggregates: any[] }) {
  return (
    <div className="text-center py-8">
      <p className="text-gray-600 mb-2">
        Maand weergave wordt geïmplementeerd in de volgende fase.
      </p>
      <p className="text-sm text-gray-500">
        Dit zal weken groeperen per maand met vergelijkingen en trends.
      </p>
    </div>
  );
}

/**
 * CompareView - Compare different time periods
 * TODO: Implement in Phase 2
 */
function CompareView({ weeklyAggregates }: { weeklyAggregates: any[] }) {
  return (
    <div className="text-center py-8">
      <p className="text-gray-600 mb-2">
        Vergelijk weergave wordt geïmplementeerd in de volgende fase.
      </p>
      <p className="text-sm text-gray-500">
        Dit zal side-by-side vergelijkingen tussen periodes mogelijk maken.
      </p>
    </div>
  );
}
