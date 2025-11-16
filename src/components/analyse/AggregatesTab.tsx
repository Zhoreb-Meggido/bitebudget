/**
 * AggregatesTab - Aggregated Nutrition & Activity Overview
 *
 * Displays three main sections:
 * 1. Nutrition Averages Over Time - Line chart with all 8 nutrition metrics
 * 2. Activity Averages Over Time - Line chart with activity metrics
 * 3. Correlation Analysis - Scatter plots for aggregated data
 */

import React, { useState, useMemo } from 'react';
import { Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAggregates } from '@/hooks/useAggregates';
import { useSettings } from '@/hooks/useSettings';
import type { AggregatePeriod } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type AggregationLevel = 'week' | 'month';
type NutritionMetricKey = 'calories' | 'protein' | 'carbs' | 'sugars' | 'fat' | 'saturatedFat' | 'fiber' | 'sodium';
type ActivityMetricKey = 'steps' | 'activeCalories' | 'totalCalories' | 'intensityMinutes' | 'sleep' | 'restingHR' | 'maxHR';

interface NutritionMetricConfig {
  key: NutritionMetricKey;
  label: string;
  color: string;
  unit: string;
  targetField?: keyof typeof defaultSettings;
}

interface ActivityMetricConfig {
  key: ActivityMetricKey;
  label: string;
  color: string;
  unit: string;
}

const defaultSettings = {
  calories: 2000,
  protein: 150,
  saturatedFat: 20,
  fiber: 28,
  sodium: 2300,
};

const NUTRITION_METRICS: NutritionMetricConfig[] = [
  { key: 'calories', label: 'Calorieën', color: 'rgb(59, 130, 246)', unit: 'kcal', targetField: 'calories' },
  { key: 'protein', label: 'Eiwit', color: 'rgb(147, 51, 234)', unit: 'g', targetField: 'protein' },
  { key: 'carbs', label: 'Koolhydraten', color: 'rgb(245, 158, 11)', unit: 'g' },
  { key: 'sugars', label: 'Suikers', color: 'rgb(251, 191, 36)', unit: 'g' },
  { key: 'fat', label: 'Vet', color: 'rgb(156, 163, 175)', unit: 'g' },
  { key: 'saturatedFat', label: 'Verzadigd Vet', color: 'rgb(239, 68, 68)', unit: 'g', targetField: 'saturatedFat' },
  { key: 'fiber', label: 'Vezels', color: 'rgb(34, 197, 94)', unit: 'g', targetField: 'fiber' },
  { key: 'sodium', label: 'Natrium', color: 'rgb(249, 115, 22)', unit: 'mg', targetField: 'sodium' },
];

const ACTIVITY_METRICS: ActivityMetricConfig[] = [
  { key: 'steps', label: 'Stappen', color: 'rgb(59, 130, 246)', unit: '' },
  { key: 'activeCalories', label: 'Actieve Cal', color: 'rgb(239, 68, 68)', unit: 'kcal' },
  { key: 'totalCalories', label: 'Totaal Cal', color: 'rgb(220, 38, 38)', unit: 'kcal' },
  { key: 'intensityMinutes', label: 'Intensiteit', color: 'rgb(147, 51, 234)', unit: 'min' },
  { key: 'sleep', label: 'Slaap', color: 'rgb(34, 197, 94)', unit: 'uur' },
  { key: 'restingHR', label: 'HR Rust', color: 'rgb(14, 165, 233)', unit: 'bpm' },
  { key: 'maxHR', label: 'HR Max', color: 'rgb(220, 38, 38)', unit: 'bpm' },
];

export function AggregatesTab() {
  const [aggregationLevel, setAggregationLevel] = useState<AggregationLevel>('week');
  const [selectedPeriod, setSelectedPeriod] = useState<AggregatePeriod>('12weeks');
  const [selectedNutritionMetrics, setSelectedNutritionMetrics] = useState<Set<NutritionMetricKey>>(
    new Set(['calories', 'protein', 'carbs'])
  );
  const [selectedActivityMetrics, setSelectedActivityMetrics] = useState<Set<ActivityMetricKey>>(
    new Set(['steps', 'activeCalories', 'sleep'])
  );
  const [correlationMetricX, setCorrelationMetricX] = useState<NutritionMetricKey | ActivityMetricKey>('calories');
  const [correlationMetricY, setCorrelationMetricY] = useState<NutritionMetricKey | ActivityMetricKey>('steps');

  const { weeklyAggregates, monthlyAggregates, isLoading } = useAggregates({
    period: selectedPeriod,
    includeActivity: true,
  });

  const { settings } = useSettings();

  // Use current aggregates based on level
  const currentAggregates = aggregationLevel === 'week' ? weeklyAggregates : monthlyAggregates;

  // Period options
  const periodOptions: { value: AggregatePeriod; label: string }[] = [
    { value: '4weeks', label: 'Laatste 4 weken' },
    { value: '8weeks', label: 'Laatste 8 weken' },
    { value: '12weeks', label: 'Laatste 12 weken' },
    { value: '6months', label: 'Laatste 6 maanden' },
    { value: '12months', label: 'Laatste 12 maanden' },
  ];

  // Toggle nutrition metric
  const toggleNutritionMetric = (key: NutritionMetricKey) => {
    setSelectedNutritionMetrics((prev: Set<NutritionMetricKey>) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        if (newSet.size > 1) newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Toggle activity metric
  const toggleActivityMetric = (key: ActivityMetricKey) => {
    setSelectedActivityMetrics((prev: Set<ActivityMetricKey>) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        if (newSet.size > 1) newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Prepare nutrition chart data
  const nutritionChartData = useMemo(() => {
    const labels = currentAggregates.map(agg => {
      if (aggregationLevel === 'week') {
        return `W${agg.weekNumber} ${agg.year}`;
      } else {
        return `${agg.monthName} ${agg.year}`;
      }
    });

    const datasets = NUTRITION_METRICS
      .filter(metric => selectedNutritionMetrics.has(metric.key))
      .map(metric => {
        const data = currentAggregates.map(agg => {
          const nutritionData = agg.nutrition;
          switch (metric.key) {
            case 'calories': return nutritionData.avgCalories;
            case 'protein': return nutritionData.avgProtein;
            case 'carbs': return nutritionData.avgCarbs;
            case 'sugars': return nutritionData.avgSugars;
            case 'fat': return nutritionData.avgFat;
            case 'saturatedFat': return nutritionData.avgSaturatedFat;
            case 'fiber': return nutritionData.avgFiber;
            case 'sodium': return nutritionData.avgSodium;
            default: return 0;
          }
        });

        return {
          label: `${metric.label} (${metric.unit})`,
          data,
          borderColor: metric.color,
          backgroundColor: metric.color + '20',
          tension: 0.3,
          borderWidth: 2,
          yAxisID: metric.key === 'calories' ? 'y-calories' : metric.key === 'sodium' ? 'y-sodium' : 'y',
        };
      });

    // Add target lines if applicable
    NUTRITION_METRICS.forEach(metric => {
      if (selectedNutritionMetrics.has(metric.key) && metric.targetField) {
        const targetValue = settings[metric.targetField] || (defaultSettings as any)[metric.targetField] || 0;
        if (targetValue > 0) {
          datasets.push({
            label: `${metric.label} doel`,
            data: currentAggregates.map(() => targetValue),
            borderColor: metric.color,
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0,
            borderWidth: 1,
            pointRadius: 0,
            yAxisID: metric.key === 'calories' ? 'y-calories' : metric.key === 'sodium' ? 'y-sodium' : 'y',
          });
        }
      }
    });

    return { labels, datasets };
  }, [currentAggregates, selectedNutritionMetrics, aggregationLevel, settings]);

  // Prepare activity chart data
  const activityChartData = useMemo(() => {
    const labels = currentAggregates.map(agg => {
      if (aggregationLevel === 'week') {
        return `W${agg.weekNumber} ${agg.year}`;
      } else {
        return `${agg.monthName} ${agg.year}`;
      }
    });

    const datasets = ACTIVITY_METRICS
      .filter(metric => selectedActivityMetrics.has(metric.key))
      .map(metric => {
        const data = currentAggregates.map(agg => {
          const activityData = agg.activity;
          if (!activityData) return 0;

          switch (metric.key) {
            case 'steps': return activityData.avgSteps;
            case 'activeCalories': return activityData.avgActiveCalories;
            case 'totalCalories': return activityData.avgTotalCalories || 0;
            case 'intensityMinutes': return activityData.avgIntensityMinutes;
            case 'sleep': return Math.round(activityData.avgSleepSeconds / 3600); // Convert to hours
            case 'restingHR': return activityData.avgHeartRateResting;
            case 'maxHR': return activityData.avgHeartRateMax;
            default: return 0;
          }
        });

        let yAxisID = 'y';
        if (metric.key === 'steps') yAxisID = 'y-steps';
        else if (metric.key === 'activeCalories' || metric.key === 'totalCalories') yAxisID = 'y-calories';
        else if (metric.key === 'restingHR' || metric.key === 'maxHR') yAxisID = 'y-hr';

        return {
          label: `${metric.label} ${metric.unit ? `(${metric.unit})` : ''}`,
          data,
          borderColor: metric.color,
          backgroundColor: metric.color + '20',
          tension: 0.3,
          borderWidth: 2,
          yAxisID,
        };
      });

    return { labels, datasets };
  }, [currentAggregates, selectedActivityMetrics, aggregationLevel]);

  // Nutrition chart options
  const nutritionChartOptions = useMemo(() => {
    const scales: any = {
      x: { grid: { display: false } },
      y: {
        type: 'linear',
        display: selectedNutritionMetrics.has('protein') || selectedNutritionMetrics.has('carbs') ||
                selectedNutritionMetrics.has('sugars') || selectedNutritionMetrics.has('fat') ||
                selectedNutritionMetrics.has('saturatedFat') || selectedNutritionMetrics.has('fiber'),
        position: 'left',
        beginAtZero: true,
        title: { display: true, text: 'Grammen (g)' },
      },
    };

    if (selectedNutritionMetrics.has('calories')) {
      scales['y-calories'] = {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        title: { display: true, text: 'Calorieën (kcal)' },
        grid: { drawOnChartArea: false },
      };
    }

    if (selectedNutritionMetrics.has('sodium')) {
      scales['y-sodium'] = {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        title: { display: true, text: 'Natrium (mg)' },
        grid: { drawOnChartArea: false },
      };
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 15 } },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleColor: '#fff',
          bodyColor: '#fff',
        },
      },
      scales,
    };
  }, [selectedNutritionMetrics]);

  // Activity chart options
  const activityChartOptions = useMemo(() => {
    const scales: any = {
      x: { grid: { display: false } },
      y: {
        type: 'linear',
        display: selectedActivityMetrics.has('intensityMinutes') || selectedActivityMetrics.has('sleep'),
        position: 'left',
        beginAtZero: true,
        title: { display: true, text: 'Min / Uur' },
      },
    };

    if (selectedActivityMetrics.has('steps')) {
      scales['y-steps'] = {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: { display: true, text: 'Stappen' },
      };
    }

    if (selectedActivityMetrics.has('activeCalories') || selectedActivityMetrics.has('totalCalories')) {
      scales['y-calories'] = {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        title: { display: true, text: 'Calorieën (kcal)' },
        grid: { drawOnChartArea: false },
      };
    }

    if (selectedActivityMetrics.has('restingHR') || selectedActivityMetrics.has('maxHR')) {
      scales['y-hr'] = {
        type: 'linear',
        display: true,
        position: 'right',
        min: 40,
        max: 220,
        title: { display: true, text: 'Hartslag (bpm)' },
        grid: { drawOnChartArea: false },
      };
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 15 } },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleColor: '#fff',
          bodyColor: '#fff',
        },
      },
      scales,
    };
  }, [selectedActivityMetrics]);

  // Correlation calculation helper
  function calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  // Get metric value from aggregate
  const getMetricValue = (agg: any, metric: NutritionMetricKey | ActivityMetricKey): number => {
    // Nutrition metrics
    if (NUTRITION_METRICS.find(m => m.key === metric)) {
      const nutritionData = agg.nutrition;
      switch (metric) {
        case 'calories': return nutritionData.avgCalories;
        case 'protein': return nutritionData.avgProtein;
        case 'carbs': return nutritionData.avgCarbs;
        case 'sugars': return nutritionData.avgSugars;
        case 'fat': return nutritionData.avgFat;
        case 'saturatedFat': return nutritionData.avgSaturatedFat;
        case 'fiber': return nutritionData.avgFiber;
        case 'sodium': return nutritionData.avgSodium;
        default: return 0;
      }
    }

    // Activity metrics
    const activityData = agg.activity;
    if (!activityData) return 0;

    switch (metric) {
      case 'steps': return activityData.avgSteps;
      case 'activeCalories': return activityData.avgActiveCalories;
      case 'totalCalories': return activityData.avgTotalCalories || 0;
      case 'intensityMinutes': return activityData.avgIntensityMinutes;
      case 'sleep': return Math.round(activityData.avgSleepSeconds / 3600);
      case 'restingHR': return activityData.avgHeartRateResting;
      case 'maxHR': return activityData.avgHeartRateMax;
      default: return 0;
    }
  };

  // Correlation data
  const correlationData = useMemo(() => {
    const xData: number[] = [];
    const yData: number[] = [];

    currentAggregates.forEach(agg => {
      const xValue = getMetricValue(agg, correlationMetricX);
      const yValue = getMetricValue(agg, correlationMetricY);

      if (xValue > 0 && yValue > 0) {
        xData.push(xValue);
        yData.push(yValue);
      }
    });

    if (xData.length === 0) return null;

    const correlation = calculateCorrelation(xData, yData);
    const scatterData = xData.map((x, i) => ({ x, y: yData[i] }));

    // Regression line
    const n = xData.length;
    const sumX = xData.reduce((a, b) => a + b, 0);
    const sumY = yData.reduce((a, b) => a + b, 0);
    const sumXY = xData.reduce((sum, xi, i) => sum + xi * yData[i], 0);
    const sumX2 = xData.reduce((sum, xi) => sum + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const minX = Math.min(...xData);
    const maxX = Math.max(...xData);
    const regressionLine = [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept },
    ];

    return { correlation, scatterData, regressionLine, dataPoints: xData.length };
  }, [currentAggregates, correlationMetricX, correlationMetricY, aggregationLevel]);

  const scatterChartData = useMemo(() => {
    if (!correlationData) return null;

    return {
      datasets: [
        {
          label: 'Data punten',
          data: correlationData.scatterData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: 'Trend lijn',
          data: correlationData.regressionLine,
          type: 'line' as const,
          borderColor: 'rgba(239, 68, 68, 0.8)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        },
      ],
    };
  }, [correlationData, correlationMetricX, correlationMetricY]);

  const scatterChartOptions = useMemo(() => {
    const allMetrics = [...NUTRITION_METRICS, ...ACTIVITY_METRICS];
    const xMetric = allMetrics.find(m => m.key === correlationMetricX);
    const yMetric = allMetrics.find(m => m.key === correlationMetricY);

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 15 } },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleColor: '#fff',
          bodyColor: '#fff',
        },
      },
      scales: {
        x: { title: { display: true, text: xMetric?.label || '' } },
        y: { title: { display: true, text: yMetric?.label || '' } },
      },
    };
  }, [correlationMetricX, correlationMetricY]);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Geaggregeerd Overzicht</h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {/* Aggregation level selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setAggregationLevel('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  aggregationLevel === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Per Week
              </button>
              <button
                onClick={() => setAggregationLevel('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  aggregationLevel === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Per Maand
              </button>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="period-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Periode:
              </label>
              <select
                id="period-select"
                value={selectedPeriod}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPeriod(e.target.value as AggregatePeriod)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Gegevens laden...</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && currentAggregates.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">Geen data beschikbaar</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Er zijn geen gegevens gevonden voor de geselecteerde periode.
          </p>
        </div>
      )}

      {!isLoading && currentAggregates.length > 0 && (
        <>
          {/* Chart 1: Nutrition Averages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                📊 Voeding Gemiddelden Over Tijd
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Geaggregeerde voedingswaarden {aggregationLevel === 'week' ? 'per week' : 'per maand'}
              </p>

              {/* Metric toggles */}
              <div className="flex flex-wrap gap-2">
                {NUTRITION_METRICS.map(metric => (
                  <button
                    key={metric.key}
                    onClick={() => toggleNutritionMetric(metric.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedNutritionMetrics.has(metric.key)
                        ? 'ring-2 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={selectedNutritionMetrics.has(metric.key) ? {
                      backgroundColor: metric.color + '15',
                      color: metric.color,
                      ringColor: metric.color,
                    } : {}}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[400px]">
              <Line data={nutritionChartData} options={nutritionChartOptions} />
            </div>
          </div>

          {/* Chart 2: Activity Averages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                🏃 Activiteit Gemiddelden Over Tijd
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Geaggregeerde activiteit metrics {aggregationLevel === 'week' ? 'per week' : 'per maand'}
              </p>

              {/* Metric toggles */}
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_METRICS.map(metric => (
                  <button
                    key={metric.key}
                    onClick={() => toggleActivityMetric(metric.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedActivityMetrics.has(metric.key)
                        ? 'ring-2 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={selectedActivityMetrics.has(metric.key) ? {
                      backgroundColor: metric.color + '15',
                      color: metric.color,
                      ringColor: metric.color,
                    } : {}}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>

            {currentAggregates.some(a => a.activity) ? (
              <div className="h-[400px]">
                <Line data={activityChartData} options={activityChartOptions} />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">Geen activity data beschikbaar</p>
                <p className="text-sm">Importeer Garmin CSV data om activity trends te zien</p>
              </div>
            )}
          </div>

          {/* Chart 3: Correlation Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                📈 Correlatie Analyse
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Ontdek verbanden tussen metrics op {aggregationLevel === 'week' ? 'week' : 'maand'} niveau
              </p>

              {/* Metric selectors */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    X-as (horizontaal)
                  </label>
                  <select
                    value={correlationMetricX}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCorrelationMetricX(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <optgroup label="Voeding">
                      {NUTRITION_METRICS.map(metric => (
                        <option key={metric.key} value={metric.key}>{metric.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Activiteit">
                      {ACTIVITY_METRICS.map(metric => (
                        <option key={metric.key} value={metric.key}>{metric.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Y-as (verticaal)
                  </label>
                  <select
                    value={correlationMetricY}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCorrelationMetricY(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <optgroup label="Voeding">
                      {NUTRITION_METRICS.map(metric => (
                        <option key={metric.key} value={metric.key}>{metric.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Activiteit">
                      {ACTIVITY_METRICS.map(metric => (
                        <option key={metric.key} value={metric.key}>{metric.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {correlationData ? (
              <>
                {/* Correlation stats */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Correlatie Coëfficiënt</div>
                      <div className={`text-4xl font-bold ${
                        Math.abs(correlationData.correlation) > 0.7 ? 'text-green-600 dark:text-green-400' :
                        Math.abs(correlationData.correlation) > 0.4 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {correlationData.correlation.toFixed(3)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {Math.abs(correlationData.correlation) > 0.7 ? '✅ Sterke correlatie' :
                         Math.abs(correlationData.correlation) > 0.4 ? '⚠️ Matige correlatie' :
                         '❌ Zwakke correlatie'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Data Punten</div>
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                        {correlationData.dataPoints}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {aggregationLevel === 'week' ? 'weken' : 'maanden'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Relatie</div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {correlationData.correlation > 0 ? '📈 Positief' : '📉 Negatief'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {correlationData.correlation > 0
                          ? 'Als X stijgt, stijgt Y ook'
                          : 'Als X stijgt, daalt Y'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scatter plot */}
                <div className="h-[400px]">
                  <Scatter data={scatterChartData!} options={scatterChartOptions} />
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">Onvoldoende data voor correlatie analyse</p>
                <p className="text-sm">Zorg voor voldoende data met beide metrics</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
