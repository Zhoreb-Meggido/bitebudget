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
import { exportWeeklyAggregatesToCSV, exportMonthlyAggregatesToCSV } from '@/utils/report.utils';
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
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

            {/* Export button */}
            {!isLoading && (
              <button
                onClick={() => {
                  if (activeView === 'week') {
                    exportWeeklyAggregatesToCSV(sortedWeeklyAggregates);
                  } else if (activeView === 'month') {
                    exportMonthlyAggregatesToCSV(monthlyAggregates);
                  }
                }}
                disabled={
                  (activeView === 'week' && sortedWeeklyAggregates.length === 0) ||
                  (activeView === 'month' && monthlyAggregates.length === 0)
                }
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                title="Export naar CSV"
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            )}
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
 */
interface CompareViewProps {
  weeklyAggregates: any[];
}

function CompareView({ weeklyAggregates }: CompareViewProps) {
  if (weeklyAggregates.length < 2) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-lg text-gray-600 mb-2">Niet genoeg data om te vergelijken</p>
        <p className="text-sm text-gray-500">
          Selecteer een langere periode om weken te kunnen vergelijken.
        </p>
      </div>
    );
  }

  // Split into two halves for comparison
  const midpoint = Math.floor(weeklyAggregates.length / 2);
  const olderWeeks = weeklyAggregates.slice(midpoint);
  const recentWeeks = weeklyAggregates.slice(0, midpoint);

  // Calculate averages for each period
  const olderAvg = calculatePeriodAverage(olderWeeks);
  const recentAvg = calculatePeriodAverage(recentWeeks);

  // Calculate changes
  const changes = {
    calories: calculateChange(olderAvg.calories, recentAvg.calories),
    protein: calculateChange(olderAvg.protein, recentAvg.protein),
    carbs: calculateChange(olderAvg.carbs, recentAvg.carbs),
    fat: calculateChange(olderAvg.fat, recentAvg.fat),
    steps: calculateChange(olderAvg.steps, recentAvg.steps),
    adherence: calculateChange(olderAvg.adherence, recentAvg.adherence),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Periode Vergelijking
        </h3>
        <p className="text-sm text-gray-600">
          Vergelijk de eerste helft met de tweede helft van de geselecteerde periode
        </p>
      </div>

      {/* Comparison cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Older period */}
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Eerste Periode</h4>
            <span className="text-sm text-gray-600">
              {olderWeeks.length} {olderWeeks.length === 1 ? 'week' : 'weken'}
            </span>
          </div>
          <PeriodMetrics avg={olderAvg} />
        </div>

        {/* Recent period */}
        <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Tweede Periode</h4>
            <span className="text-sm text-gray-600">
              {recentWeeks.length} {recentWeeks.length === 1 ? 'week' : 'weken'}
            </span>
          </div>
          <PeriodMetrics avg={recentAvg} />
        </div>
      </div>

      {/* Changes overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">📈 Veranderingen</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ChangeMetric label="Calorieën" change={changes.calories} unit="kcal" />
          <ChangeMetric label="Eiwit" change={changes.protein} unit="g" />
          <ChangeMetric label="Koolhydraten" change={changes.carbs} unit="g" />
          <ChangeMetric label="Vetten" change={changes.fat} unit="g" />
          <ChangeMetric label="Stappen" change={changes.steps} />
          <ChangeMetric label="Naleving" change={changes.adherence} unit="%" isPercentage />
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate average metrics for a period
 */
function calculatePeriodAverage(weeks: any[]) {
  if (weeks.length === 0) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      steps: 0,
      adherence: 0,
    };
  }

  const sum = weeks.reduce((acc, week) => ({
    calories: acc.calories + week.nutrition.avgCalories,
    protein: acc.protein + week.nutrition.avgProtein,
    carbs: acc.carbs + week.nutrition.avgCarbs,
    fat: acc.fat + week.nutrition.avgFat,
    steps: acc.steps + (week.activity?.avgSteps || 0),
    daysInRange: acc.daysInRange + week.nutrition.daysInRange,
    daysTracked: acc.daysTracked + week.daysTracked,
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    steps: 0,
    daysInRange: 0,
    daysTracked: 0,
  });

  const count = weeks.length;
  const adherence = sum.daysTracked > 0 ? (sum.daysInRange / sum.daysTracked) * 100 : 0;

  return {
    calories: Math.round(sum.calories / count),
    protein: Math.round(sum.protein / count),
    carbs: Math.round(sum.carbs / count),
    fat: Math.round(sum.fat / count),
    steps: Math.round(sum.steps / count),
    adherence: Math.round(adherence),
  };
}

/**
 * Calculate percentage change
 */
function calculateChange(oldValue: number, newValue: number) {
  if (oldValue === 0) return { value: newValue, percentage: 0 };
  const diff = newValue - oldValue;
  const percentage = (diff / oldValue) * 100;
  return { value: diff, percentage: Math.round(percentage) };
}

/**
 * PeriodMetrics - Display metrics for a period
 */
function PeriodMetrics({ avg }: { avg: any }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Ø Calorieën:</span>
        <span className="font-semibold">{avg.calories} kcal</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Ø Eiwit:</span>
        <span className="font-semibold">{avg.protein}g</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Ø Koolhydraten:</span>
        <span className="font-semibold">{avg.carbs}g</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Ø Vetten:</span>
        <span className="font-semibold">{avg.fat}g</span>
      </div>
      {avg.steps > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Ø Stappen:</span>
          <span className="font-semibold">{avg.steps.toLocaleString()}</span>
        </div>
      )}
      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
        <span className="text-gray-600">Naleving:</span>
        <span className="font-semibold">{avg.adherence}%</span>
      </div>
    </div>
  );
}

/**
 * ChangeMetric - Display a change metric
 */
interface ChangeMetricProps {
  label: string;
  change: { value: number; percentage: number };
  unit?: string;
  isPercentage?: boolean;
}

function ChangeMetric({ label, change, unit = '', isPercentage = false }: ChangeMetricProps) {
  const isPositive = change.value > 0;
  const isNegative = change.value < 0;
  const isNeutral = change.value === 0;

  const colorClass = isPositive
    ? 'text-green-600'
    : isNegative
    ? 'text-red-600'
    : 'text-gray-600';

  const arrow = isPositive ? '↑' : isNegative ? '↓' : '→';

  return (
    <div className="text-sm">
      <div className="text-gray-600 mb-1">{label}</div>
      <div className={`font-semibold ${colorClass} flex items-center gap-1`}>
        <span>{arrow}</span>
        <span>
          {isPositive && '+'}
          {isPercentage ? change.percentage : Math.abs(change.value)}
          {unit}
        </span>
        {!isPercentage && change.percentage !== 0 && (
          <span className="text-xs">({change.percentage > 0 && '+'}{change.percentage}%)</span>
        )}
      </div>
    </div>
  );
}
