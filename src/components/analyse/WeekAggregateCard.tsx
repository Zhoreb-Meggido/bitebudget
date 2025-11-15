/**
 * WeekAggregateCard - Rich display of weekly aggregate data
 *
 * Shows nutrition and activity metrics for a single week with
 * calorie adherence visualization and responsive layout.
 */

import React from 'react';
import type { WeekAggregate } from '@/types';

interface WeekAggregateCardProps {
  aggregate: WeekAggregate;
  settings?: { calories: number };
}

export function WeekAggregateCard({ aggregate, settings }: WeekAggregateCardProps) {
  const { weekNumber, year, weekStart, weekEnd, daysTracked, nutrition, activity } = aggregate;

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  // Calculate calorie adherence percentage
  const totalDays = daysTracked;
  const adherencePercentage = totalDays > 0
    ? Math.round((nutrition.daysInRange / totalDays) * 100)
    : 0;

  // Determine color for calorie average
  const getCalorieColor = () => {
    if (!settings) return 'text-gray-900';
    const diff = nutrition.avgCalories - settings.calories;
    const percentDiff = Math.abs(diff / settings.calories) * 100;

    if (percentDiff <= 10) return 'text-green-600';
    if (percentDiff <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Week {weekNumber}, {year}
          </h3>
          <p className="text-sm text-gray-600">
            {formatDate(weekStart)} - {formatDate(weekEnd)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📅</span>
          <span className="text-sm font-medium text-gray-700">
            {daysTracked}/7 dagen
          </span>
        </div>
      </div>

      {/* Nutrition Section */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>🍎</span>
          Voeding
        </h4>

        {/* Main metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <MetricBox
            label="Ø Calorieën"
            value={nutrition.avgCalories}
            unit="kcal"
            highlight={true}
            colorClass={getCalorieColor()}
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

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="text-gray-600">
            <span className="font-medium">Vezels:</span> {nutrition.avgFiber}g
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Suikers:</span> {nutrition.avgSugars}g
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Verz. vet:</span> {nutrition.avgSaturatedFat}g
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Natrium:</span> {nutrition.avgSodium}mg
          </div>
        </div>

        {/* Calorie adherence visualization */}
        {settings && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">
                Calorie Naleving
              </span>
              <span className="text-xs font-semibold text-gray-900">
                {adherencePercentage}% binnen bereik
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200">
              <div
                className="bg-yellow-400 transition-all"
                style={{ width: `${(nutrition.daysUnderCalorieTarget / totalDays) * 100}%` }}
                title={`${nutrition.daysUnderCalorieTarget} dagen onder target`}
              />
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(nutrition.daysInRange / totalDays) * 100}%` }}
                title={`${nutrition.daysInRange} dagen binnen bereik`}
              />
              <div
                className="bg-red-400 transition-all"
                style={{ width: `${(nutrition.daysOverCalorieTarget / totalDays) * 100}%` }}
                title={`${nutrition.daysOverCalorieTarget} dagen boven target`}
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="text-gray-600">
                  {nutrition.daysUnderCalorieTarget} onder
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">
                  {nutrition.daysInRange} binnen bereik
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-gray-600">
                  {nutrition.daysOverCalorieTarget} boven
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Section (if available) */}
      {activity && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>🏃</span>
            Activiteit
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricBox
              label="Ø Stappen"
              value={activity.avgSteps}
              icon="👟"
            />
            <MetricBox
              label="Ø Actieve Cal."
              value={activity.avgActiveCalories}
              unit="kcal"
              icon="🔥"
            />
            <MetricBox
              label="Ø Intensiteit"
              value={activity.avgIntensityMinutes}
              unit="min"
              icon="💪"
            />
            <MetricBox
              label="Ø Slaap"
              value={formatSleepHours(activity.avgSleepSeconds)}
              icon="😴"
            />
          </div>

          {/* Additional activity metrics */}
          {(activity.avgHeartRateResting > 0 || activity.avgDistanceMeters > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
              {activity.avgHeartRateResting > 0 && (
                <div className="text-gray-600">
                  <span className="font-medium">Ø Rust HR:</span> {activity.avgHeartRateResting} bpm
                </div>
              )}
              {activity.avgHeartRateMax > 0 && (
                <div className="text-gray-600">
                  <span className="font-medium">Ø Max HR:</span> {activity.avgHeartRateMax} bpm
                </div>
              )}
              {activity.avgDistanceMeters > 0 && (
                <div className="text-gray-600">
                  <span className="font-medium">Ø Afstand:</span> {formatDistance(activity.avgDistanceMeters)}
                </div>
              )}
              {activity.avgFloorsClimbed > 0 && (
                <div className="text-gray-600">
                  <span className="font-medium">Ø Verdiepingen:</span> {activity.avgFloorsClimbed}
                </div>
              )}
            </div>
          )}
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
  icon?: string;
  highlight?: boolean;
  colorClass?: string;
}

function MetricBox({ label, value, unit, icon, highlight, colorClass }: MetricBoxProps) {
  return (
    <div className={`${highlight ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'} rounded-lg p-3`}>
      {icon && <div className="text-lg mb-1">{icon}</div>}
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${colorClass || 'text-gray-900'}`}>
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

/**
 * Helper: Format distance in meters to km
 */
function formatDistance(meters: number): string {
  const km = meters / 1000;
  return km.toFixed(1) + ' km';
}
