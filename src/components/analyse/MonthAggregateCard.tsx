/**
 * MonthAggregateCard - Display monthly aggregate data
 *
 * Shows monthly nutrition and activity summaries with weekly breakdown
 * and best/worst week indicators.
 */

import React, { useState } from 'react';
import type { MonthAggregate } from '@/types';
import { WeekAggregateCard } from './WeekAggregateCard';

interface MonthAggregateCardProps {
  aggregate: MonthAggregate;
  settings?: { calories: number };
}

export function MonthAggregateCard({ aggregate, settings }: MonthAggregateCardProps) {
  const [showWeeks, setShowWeeks] = useState(false);
  const { monthName, year, daysTracked, nutrition, activity, weeksInMonth } = aggregate;

  // Calculate adherence percentage
  const adherencePercentage = daysTracked > 0
    ? Math.round((nutrition.totalDaysTracked / daysTracked) * 100)
    : 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Main card content */}
      <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {monthName} {year}
            </h3>
            <p className="text-sm text-gray-600">
              {weeksInMonth.length} {weeksInMonth.length === 1 ? 'week' : 'weken'} • {daysTracked} dagen geregistreerd
            </p>
          </div>
          <div className="text-3xl">📆</div>
        </div>

        {/* Monthly nutrition summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <MetricBox
            label="Ø Calorieën"
            value={nutrition.avgCalories}
            unit="kcal"
            highlight={true}
          />
          <MetricBox
            label="Ø Eiwit"
            value={nutrition.avgProtein}
            unit="g"
          />
          <MetricBox
            label="Ø Koolhydraten"
            value={nutrition.avgCarbs}
            unit="g"
          />
          <MetricBox
            label="Ø Vetten"
            value={nutrition.avgFat}
            unit="g"
          />
        </div>

        {/* Best/Worst week indicators */}
        {weeksInMonth.length > 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🌟</span>
                <span className="text-xs font-semibold text-green-700">Beste Week</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                Week {nutrition.bestWeek}
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📉</span>
                <span className="text-xs font-semibold text-orange-700">Aandachtspunt</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                Week {nutrition.worstWeek}
              </div>
            </div>
          </div>
        )}

        {/* Activity summary (if available) */}
        {activity && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
            <div className="text-sm">
              <div className="text-gray-600 mb-1">Ø Stappen</div>
              <div className="font-semibold text-gray-900">
                {activity.avgSteps.toLocaleString()}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-gray-600 mb-1">Ø Actieve Cal.</div>
              <div className="font-semibold text-gray-900">
                {activity.avgActiveCalories} kcal
              </div>
            </div>
            <div className="text-sm">
              <div className="text-gray-600 mb-1">Ø Intensiteit</div>
              <div className="font-semibold text-gray-900">
                {activity.avgIntensityMinutes} min
              </div>
            </div>
            <div className="text-sm">
              <div className="text-gray-600 mb-1">Ø Slaap</div>
              <div className="font-semibold text-gray-900">
                {formatSleepHours(activity.avgSleepSeconds)}
              </div>
            </div>
          </div>
        )}

        {/* Toggle weeks button */}
        <button
          onClick={() => setShowWeeks(!showWeeks)}
          className="mt-4 w-full py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          {showWeeks ? '▲ Verberg weken' : '▼ Toon weken'}
          <span className="text-xs text-gray-500">
            ({weeksInMonth.length})
          </span>
        </button>
      </div>

      {/* Weekly breakdown (collapsible) */}
      {showWeeks && (
        <div className="bg-gray-50 p-4 space-y-3 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Week overzicht
          </h4>
          {weeksInMonth.map((week) => (
            <WeekAggregateCard
              key={`${week.year}-W${week.weekNumber}`}
              aggregate={week}
              settings={settings}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MetricBox - Small metric display component
 */
interface MetricBoxProps {
  label: string;
  value: number | string;
  unit?: string;
  highlight?: boolean;
}

function MetricBox({ label, value, unit, highlight }: MetricBoxProps) {
  return (
    <div className={`${highlight ? 'bg-white border border-blue-200' : 'bg-white/50'} rounded-lg p-3`}>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900">
        {value}
        {unit && <span className="text-sm font-normal text-gray-600 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

/**
 * Helper: Format sleep seconds to hours
 */
function formatSleepHours(seconds: number): string {
  const hours = seconds / 3600;
  return hours.toFixed(1) + 'h';
}
