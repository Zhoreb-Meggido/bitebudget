import { useState, useMemo } from 'react';
import { useEntries, useSettings } from '@/hooks';
import { Line } from 'react-chartjs-2';
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
import { PeriodSelector } from '@/components/shared/PeriodSelector';
import type { Entry } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type MetricKey = 'calories' | 'protein' | 'carbohydrates' | 'sugars' | 'fat' | 'saturatedFat' | 'fiber' | 'sodium';

interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
}

interface MetricConfig {
  key: MetricKey;
  label: string;
  color: string;
  unit: string;
}

const METRICS: MetricConfig[] = [
  { key: 'calories', label: 'Calorieën', color: 'rgb(59, 130, 246)', unit: 'kcal' },
  { key: 'protein', label: 'Eiwit', color: 'rgb(147, 51, 234)', unit: 'g' },
  { key: 'carbohydrates', label: 'Koolhydraten', color: 'rgb(245, 158, 11)', unit: 'g' },
  { key: 'sugars', label: 'Suikers', color: 'rgb(251, 191, 36)', unit: 'g' },
  { key: 'fat', label: 'Vet', color: 'rgb(156, 163, 175)', unit: 'g' },
  { key: 'saturatedFat', label: 'Verzadigd Vet', color: 'rgb(239, 68, 68)', unit: 'g' },
  { key: 'fiber', label: 'Vezels', color: 'rgb(34, 197, 94)', unit: 'g' },
  { key: 'sodium', label: 'Natrium', color: 'rgb(249, 115, 22)', unit: 'mg' },
];

export function DashboardPage() {
  const { entries } = useEntries();
  const { settings } = useSettings();

  const [selectedMetrics, setSelectedMetrics] = useState<Set<MetricKey>>(new Set(['calories', 'protein', 'carbohydrates']));
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>(entries);

  // Aggregate entries per day
  const dailyData = useMemo(() => {
    const days: Map<string, DayData> = new Map();

    filteredEntries.forEach(entry => {
      const existing = days.get(entry.date) || {
        date: entry.date,
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        sugars: 0,
        fat: 0,
        saturatedFat: 0,
        fiber: 0,
        sodium: 0,
      };

      days.set(entry.date, {
        date: entry.date,
        calories: existing.calories + (entry.calories || 0),
        protein: existing.protein + (entry.protein || 0),
        carbohydrates: existing.carbohydrates + (entry.carbohydrates || 0),
        sugars: existing.sugars + (entry.sugars || 0),
        fat: existing.fat + (entry.fat || 0),
        saturatedFat: existing.saturatedFat + (entry.saturatedFat || 0),
        fiber: existing.fiber + (entry.fiber || 0),
        sodium: existing.sodium + (entry.sodium || 0),
      });
    });

    return Array.from(days.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEntries]);

  // Calculate averages and stats
  const stats = useMemo(() => {
    if (dailyData.length === 0) {
      return {
        averages: {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          sugars: 0,
          fat: 0,
          saturatedFat: 0,
          fiber: 0,
          sodium: 0,
        },
        projectedWeightChange: 0,
      };
    }

    const sum = dailyData.reduce((acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbohydrates: acc.carbohydrates + day.carbohydrates,
      sugars: acc.sugars + day.sugars,
      fat: acc.fat + day.fat,
      saturatedFat: acc.saturatedFat + day.saturatedFat,
      fiber: acc.fiber + day.fiber,
      sodium: acc.sodium + day.sodium,
    }), {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      sugars: 0,
      fat: 0,
      saturatedFat: 0,
      fiber: 0,
      sodium: 0,
    });

    const count = dailyData.length;
    const averages = {
      calories: Math.round(sum.calories / count),
      protein: Math.round(sum.protein / count),
      carbohydrates: Math.round(sum.carbohydrates / count),
      sugars: Math.round(sum.sugars / count),
      fat: Math.round(sum.fat / count),
      saturatedFat: Math.round(sum.saturatedFat / count),
      fiber: Math.round(sum.fiber / count),
      sodium: Math.round(sum.sodium / count),
    };

    // Calculate projected weight change per week
    // Calorie deficit/surplus per day, assuming 7700 kcal = 1 kg
    const calorieGoal = settings.calories;
    const dailyDeficit = calorieGoal - averages.calories;
    const weeklyDeficit = dailyDeficit * 7;
    // Negative sign: deficit (eating less) = weight loss (negative weight change)
    const projectedWeightChange = parseFloat((-weeklyDeficit / 7700).toFixed(2));

    return {
      averages,
      projectedWeightChange,
    };
  }, [dailyData, settings]);

  const averages = stats.averages;

  // Toggle metric visibility
  const toggleMetric = (key: MetricKey) => {
    const newSelected = new Set(selectedMetrics);
    if (newSelected.has(key)) {
      if (newSelected.size > 1) { // Keep at least one metric visible
        newSelected.delete(key);
      }
    } else {
      newSelected.add(key);
    }
    setSelectedMetrics(newSelected);
  };

  // Prepare chart data
  const labels = dailyData.map(d => {
    const date = new Date(d.date);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  // Assign y-axis based on metric scale
  const getYAxisId = (key: MetricKey): string => {
    if (key === 'calories') return 'y-calories';
    if (key === 'sodium') return 'y-sodium';
    return 'y'; // protein, carbohydrates, sugars, fat, saturatedFat, fiber (all in grams)
  };

  const datasets = METRICS
    .filter(metric => selectedMetrics.has(metric.key))
    .map(metric => ({
      label: `${metric.label} (${metric.unit})`,
      data: dailyData.map(d => d[metric.key]),
      borderColor: metric.color,
      backgroundColor: metric.color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
      tension: 0.3,
      yAxisID: getYAxisId(metric.key),
    }));

  const chartData = {
    labels,
    datasets,
  };

  // Build scales dynamically based on selected metrics
  const scales: any = {
    y: {
      type: 'linear',
      display: selectedMetrics.has('protein') || selectedMetrics.has('carbohydrates') ||
              selectedMetrics.has('sugars') || selectedMetrics.has('fat') ||
              selectedMetrics.has('saturatedFat') || selectedMetrics.has('fiber'),
      position: 'left',
      beginAtZero: true,
      title: {
        display: true,
        text: 'Grammen (g)',
      },
    },
  };

  if (selectedMetrics.has('calories')) {
    scales['y-calories'] = {
      type: 'linear',
      display: true,
      position: 'right',
      beginAtZero: true,
      title: {
        display: true,
        text: 'Calorieën (kcal)',
      },
      grid: {
        drawOnChartArea: false,
      },
    };
  }

  if (selectedMetrics.has('sodium')) {
    scales['y-sodium'] = {
      type: 'linear',
      display: true,
      position: scales['y-calories'] ? 'right' : 'right',
      beginAtZero: true,
      title: {
        display: true,
        text: 'Natrium (mg)',
      },
      grid: {
        drawOnChartArea: false,
      },
    };
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Voedingsinname over tijd',
      },
    },
    scales,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overzicht van je voedingsinname</p>
      </div>

      {/* Dashboard Period Selector */}
      <div className="mb-6">
        <PeriodSelector
          entries={entries}
          showExportButtons={false}
          defaultTimeRange="14"
          onPeriodChange={(_, filtered) => setFilteredEntries(filtered)}
        />
      </div>

      {dailyData.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">
            Geen data beschikbaar voor de geselecteerde periode.
            <br />
            Voeg maaltijden toe in het Journaal om je voortgang te volgen.
          </p>
        </div>
      ) : (
        <>
          {/* Metric Toggle Buttons */}
          <div className="bg-white rounded-lg shadow mb-6 p-4 sm:p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Metrics (klik om te tonen/verbergen)
            </label>
            <div className="flex flex-wrap gap-2">
              {METRICS.map(metric => (
                <button
                  key={metric.key}
                  onClick={() => toggleMetric(metric.key)}
                  className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                    selectedMetrics.has(metric.key)
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  style={selectedMetrics.has(metric.key) ? { backgroundColor: metric.color } : {}}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
            <div className="h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Detailed Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {METRICS.map(metric => (
              <div key={metric.key} className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600 mb-1">Gem. {metric.label}</p>
                <p className="text-2xl font-bold" style={{ color: metric.color }}>
                  {averages[metric.key]}
                </p>
                <p className="text-xs text-gray-500">{metric.unit}/dag</p>
              </div>
            ))}
          </div>

          {/* Projected Weight Change Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-700 text-base font-semibold">Gewichtsprojectie per week</h3>
              <span className="text-2xl">{stats.projectedWeightChange < 0 ? '📉' : '📈'}</span>
            </div>
            <p className={`text-3xl font-bold ${stats.projectedWeightChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.projectedWeightChange > 0 ? '+' : ''}{stats.projectedWeightChange}kg
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {stats.projectedWeightChange < 0 ? 'Verwacht gewichtsverlies' : 'Verwachte gewichtstoename'} bij huidig gemiddeld calorietekort
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Gebaseerd op 7700 kcal = 1 kg lichaamsgewicht
            </p>
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporteren</h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecteer een periode en exporteer je data als PDF, CSV of TXT bestand.
            </p>
            <PeriodSelector
              entries={entries}
              showExportButtons={true}
              defaultTimeRange="14"
            />
          </div>
        </>
      )}
    </div>
  );
}
