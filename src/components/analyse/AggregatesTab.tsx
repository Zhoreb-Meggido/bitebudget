/**
 * AggregatesTab - Weekly and Monthly Aggregate Views
 *
 * Provides overview of nutrition and activity data aggregated by week or month.
 * Allows comparing different time periods and exporting data.
 */

import React, { useState, useMemo } from 'react';
import { useAggregates } from '@/hooks/useAggregates';
import { useSettings } from '@/hooks/useSettings';
import { WeekAggregateCard } from './WeekAggregateCard';
import { MonthAggregateCard } from './MonthAggregateCard';
import type { AggregatePeriod } from '@/types';

type AggregateView = 'week' | 'month' | 'compare';

export function AggregatesTab() {
  const [activeView, setActiveView] = useState<AggregateView>('week');
  const [selectedPeriod, setSelectedPeriod] = useState<AggregatePeriod>('12weeks');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // Most recent first

  const { weeklyAggregates, monthlyAggregates, isLoading } = useAggregates({
    period: selectedPeriod,
    includeActivity: true,
  });

  const { settings } = useSettings();

  // Sort aggregates based on sortOrder
  const sortedWeeklyAggregates = useMemo(() => {
    return [...weeklyAggregates].sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.weekStart.localeCompare(a.weekStart);
      }
      return a.weekStart.localeCompare(b.weekStart);
    });
  }, [weeklyAggregates, sortOrder]);

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
            <WeekView
              aggregates={sortedWeeklyAggregates}
              settings={settings}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />
          )}
          {activeView === 'month' && (
            <MonthView aggregates={monthlyAggregates} settings={settings} />
          )}
          {activeView === 'compare' && (
            <CompareView weeklyAggregates={sortedWeeklyAggregates} />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * WeekView - Display weekly aggregates
 */
interface WeekViewProps {
  aggregates: any[];
  settings?: any;
  sortOrder: 'desc' | 'asc';
  onSortOrderChange: (order: 'desc' | 'asc') => void;
}

function WeekView({ aggregates, settings, sortOrder, onSortOrderChange }: WeekViewProps) {
  if (aggregates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📅</div>
        <p className="text-lg text-gray-600 mb-2">Geen data beschikbaar</p>
        <p className="text-sm text-gray-500">
          Er zijn geen weekgegevens gevonden voor de geselecteerde periode.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header with sorting */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-700">
          {aggregates.length} {aggregates.length === 1 ? 'week' : 'weken'} gevonden
        </p>
        <button
          onClick={() => onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          {sortOrder === 'desc' ? '↓ Nieuwste eerst' : '↑ Oudste eerst'}
        </button>
      </div>

      {/* Week cards */}
      <div className="space-y-4">
        {aggregates.map((week, idx) => (
          <WeekAggregateCard
            key={`${week.year}-W${week.weekNumber}`}
            aggregate={week}
            settings={settings}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * MonthView - Display monthly aggregates
 */
interface MonthViewProps {
  aggregates: any[];
  settings?: any;
}

function MonthView({ aggregates, settings }: MonthViewProps) {
  if (aggregates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📆</div>
        <p className="text-lg text-gray-600 mb-2">Geen data beschikbaar</p>
        <p className="text-sm text-gray-500">
          Er zijn geen maandgegevens gevonden voor de geselecteerde periode.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-700">
          {aggregates.length} {aggregates.length === 1 ? 'maand' : 'maanden'} gevonden
        </p>
      </div>

      {/* Month cards */}
      <div className="space-y-4">
        {aggregates.map((month) => (
          <MonthAggregateCard
            key={`${month.year}-${month.month}`}
            aggregate={month}
            settings={settings}
          />
        ))}
      </div>
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
