import { useState, useMemo } from 'react';
import { useActivities } from '@/hooks';
import { Line, Scatter } from 'react-chartjs-2';
import type { DailyActivity } from '@/types';
import type { TimeRange } from '@/components/shared/PeriodSelector';
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
import { CHART_COLORS, commonPlugins, getResponsiveConfig, createYAxis } from '@/config/chart.config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type MetricKey = 'steps' | 'calories' | 'intensityMinutes' | 'restingHeartRate' | 'maxHeartRate' | 'stressLevel' | 'sleepDuration' | 'hrvOvernight' | 'hrv7DayAvg';

interface MetricConfig {
  key: MetricKey;
  label: string;
  color: string;
  unit: string;
}

const METRICS: MetricConfig[] = [
  { key: 'steps', label: 'Stappen', color: CHART_COLORS.activity.steps, unit: '' },
  { key: 'calories', label: 'Calorieën', color: CHART_COLORS.activity.caloriesAlt, unit: 'kcal' },
  { key: 'intensityMinutes', label: 'Intensiteit', color: CHART_COLORS.activity.intensityMinutes, unit: 'min' },
  { key: 'restingHeartRate', label: 'HR Rust', color: CHART_COLORS.activity.heartRate, unit: 'bpm' },
  { key: 'maxHeartRate', label: 'HR Max', color: CHART_COLORS.activity.heartRateMax, unit: 'bpm' },
  { key: 'stressLevel', label: 'Stress', color: CHART_COLORS.activity.stress, unit: '' },
  { key: 'sleepDuration', label: 'Slaap', color: CHART_COLORS.activity.sleep, unit: 'uur' },
  { key: 'hrvOvernight', label: 'HRV', color: CHART_COLORS.activity.hrv, unit: 'ms' },
  { key: 'hrv7DayAvg', label: 'HRV 7d', color: 'rgb(6, 182, 212)', unit: 'ms' },
];

// Correlation calculation helper
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a: number, b: number) => a + b, 0);
  const sumY = y.reduce((a: number, b: number) => a + b, 0);
  const sumXY = x.reduce((sum: number, xi: number, i: number) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum: number, xi: number) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum: number, yi: number) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function TrendsTab() {
  const { activities } = useActivities();
  const [selectedMetrics, setSelectedMetrics] = useState<Set<MetricKey>>(
    new Set(['steps', 'calories', 'intensityMinutes'])
  );
  const [timeRange, setTimeRange] = useState<TimeRange>('28');
  const [correlationMetricX, setCorrelationMetricX] = useState<MetricKey>('steps');
  const [correlationMetricY, setCorrelationMetricY] = useState<MetricKey>('calories');

  // Helper to get period label from timeRange
  const getPeriodLabel = (range: TimeRange): string => {
    switch (range) {
      case '7': return '7 dagen';
      case '14': return '14 dagen';
      case '28': return '28 dagen';
      case '90': return '90 dagen';
      case 'this-week': return 'deze week';
      case 'last-week': return 'vorige week';
      case 'this-month': return 'deze maand';
      case 'last-month': return 'vorige maand';
      case 'all': return 'alles';
      default: return '28 dagen';
    }
  };

  // Calculate date range based on selected time range (excluding today)
  const dateRange = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let startDate: string;
    let endDate: string;

    switch (timeRange) {
      case '7': {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - 6);
        startDate = date.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case '14': {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - 13);
        startDate = date.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case '28': {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - 27);
        startDate = date.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case '90': {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - 89);
        startDate = date.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case 'this-week': {
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startDate = monday.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case 'last-week': {
        const dayOfWeek = today.getDay();
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        startDate = lastMonday.toISOString().split('T')[0];
        endDate = lastSunday.toISOString().split('T')[0];
        break;
      }
      case 'this-month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case 'last-month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
        break;
      }
      case 'all': {
        const allDates = activities.map((a: DailyActivity) => a.date).filter(d => d < today.toISOString().split('T')[0]).sort();
        startDate = allDates[0] || yesterdayStr;
        endDate = allDates[allDates.length - 1] || yesterdayStr;
        break;
      }
      default: {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - 27);
        startDate = date.toISOString().split('T')[0];
        endDate = yesterdayStr;
      }
    }

    return { startDate, endDate };
  }, [timeRange, activities]);

  // Filter activities by date range (excluding today)
  const filteredActivities = useMemo(() => {
    return activities
      .filter((a: DailyActivity) => a.date >= dateRange.startDate && a.date <= dateRange.endDate)
      .sort((a: DailyActivity, b: DailyActivity) => a.date.localeCompare(b.date));
  }, [activities, dateRange]);

  // Calculate stats for the period
  const stats = useMemo(() => {
    if (filteredActivities.length === 0) {
      return {
        avgSteps: 0,
        avgCalories: 0,
        avgIntensityMinutes: 0,
        avgRestingHR: 0,
        avgStress: 0,
        avgSleep: 0,
        avgHrvOvernight: 0,
        avgHrv7Day: 0,
        daysWithData: 0,
      };
    }

    interface SumAcc {
      steps: number;
      calories: number;
      intensityMinutes: number;
      restingHR: number;
      stress: number;
      sleep: number;
      hrvOvernight: number;
      hrv7Day: number;
    }

    const sum = filteredActivities.reduce((acc: SumAcc, day: DailyActivity): SumAcc => ({
      steps: acc.steps + (day.steps || 0),
      calories: acc.calories + (day.totalCalories || 0),
      intensityMinutes: acc.intensityMinutes + (day.intensityMinutes || 0),
      restingHR: acc.restingHR + (day.heartRateResting || 0),
      stress: acc.stress + (day.stressLevel || 0),
      sleep: acc.sleep + (day.sleepSeconds || 0),
      hrvOvernight: acc.hrvOvernight + (day.hrvOvernight || 0),
      hrv7Day: acc.hrv7Day + (day.hrv7DayAvg || 0),
    }), {
      steps: 0,
      calories: 0,
      intensityMinutes: 0,
      restingHR: 0,
      stress: 0,
      sleep: 0,
      hrvOvernight: 0,
      hrv7Day: 0,
    });

    const count = filteredActivities.length;

    return {
      avgSteps: Math.round(sum.steps / count),
      avgCalories: Math.round(sum.calories / count),
      avgIntensityMinutes: Math.round(sum.intensityMinutes / count),
      avgRestingHR: Math.round(sum.restingHR / count),
      avgStress: Math.round(sum.stress / count),
      avgSleep: (sum.sleep / count / 3600).toFixed(1), // Convert seconds to hours
      avgHrvOvernight: Math.round(sum.hrvOvernight / count),
      avgHrv7Day: Math.round(sum.hrv7Day / count),
      daysWithData: count,
    };
  }, [filteredActivities]);

  // Prepare chart data with multiple Y-axes
  const chartData = useMemo(() => {
    const labels = filteredActivities.map((a: DailyActivity) => {
      const date = new Date(a.date);
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    });

    const datasets = METRICS
      .filter((metric: MetricConfig) => selectedMetrics.has(metric.key))
      .map((metric: MetricConfig) => {
        let data: number[];
        let yAxisID: string;

        switch (metric.key) {
          case 'steps':
            data = filteredActivities.map((a: DailyActivity) => a.steps || 0);
            yAxisID = 'y-steps';
            break;
          case 'calories':
            data = filteredActivities.map((a: DailyActivity) => a.totalCalories || 0);
            yAxisID = 'y-calories';
            break;
          case 'intensityMinutes':
            data = filteredActivities.map((a: DailyActivity) => a.intensityMinutes || 0);
            yAxisID = 'y-minutes';
            break;
          case 'restingHeartRate':
            data = filteredActivities.map((a: DailyActivity) => a.heartRateResting || 0);
            yAxisID = 'y-heartrate';
            break;
          case 'maxHeartRate':
            data = filteredActivities.map((a: DailyActivity) => a.heartRateMax || 0);
            yAxisID = 'y-heartrate';
            break;
          case 'stressLevel':
            data = filteredActivities.map((a: DailyActivity) => a.stressLevel || 0);
            yAxisID = 'y-stress';
            break;
          case 'sleepDuration':
            data = filteredActivities.map((a: DailyActivity) => (a.sleepSeconds || 0) / 3600); // Convert to hours
            yAxisID = 'y-sleep';
            break;
          case 'hrvOvernight':
            data = filteredActivities.map((a: DailyActivity) => a.hrvOvernight || 0);
            yAxisID = 'y-hrv';
            break;
          case 'hrv7DayAvg':
            data = filteredActivities.map((a: DailyActivity) => a.hrv7DayAvg || 0);
            yAxisID = 'y-hrv';
            break;
          default:
            data = [];
            yAxisID = 'y';
        }

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
  }, [filteredActivities, selectedMetrics]);

  const chartOptions = useMemo(() => {
    const { isVerySmall, isMobile, fontSize, tickFontSize, maxTicksLimit } = getResponsiveConfig();

    // Build scales dynamically based on selected metrics
    const scales: any = {
      x: { grid: { display: false } },
    };

    // Add Y-axis for each selected metric
    if (selectedMetrics.has('steps')) {
      scales['y-steps'] = createYAxis({
        display: !isVerySmall,
        position: 'left',
        title: !isMobile ? 'Stappen' : undefined,
        color: CHART_COLORS.activity.steps,
        fontSize,
        maxTicksLimit,
      });
    }

    if (selectedMetrics.has('calories')) {
      scales['y-calories'] = createYAxis({
        display: !isVerySmall,
        position: 'right',
        title: !isMobile ? 'Cal' : undefined,
        color: CHART_COLORS.activity.caloriesAlt,
        fontSize,
        maxTicksLimit,
        drawOnChartArea: false,
      });
    }

    if (selectedMetrics.has('intensityMinutes')) {
      scales['y-minutes'] = createYAxis({
        display: !isVerySmall,
        position: 'right',
        title: !isMobile ? 'Int' : undefined,
        color: CHART_COLORS.activity.intensityMinutes,
        fontSize,
        maxTicksLimit,
        drawOnChartArea: false,
      });
    }

    if (selectedMetrics.has('restingHeartRate') || selectedMetrics.has('maxHeartRate')) {
      scales['y-heartrate'] = {
        ...createYAxis({
          display: !isVerySmall,
          position: 'right',
          title: !isMobile ? 'Hartslag (bpm)' : undefined,
          color: 'rgb(107, 114, 128)',
          fontSize,
          maxTicksLimit,
          drawOnChartArea: false,
          beginAtZero: false,
        }),
        min: 40,
        max: 220,
      };
    }

    if (selectedMetrics.has('stressLevel')) {
      scales['y-stress'] = {
        ...createYAxis({
          display: !isVerySmall,
          position: 'right',
          title: !isMobile ? 'Stress' : undefined,
          color: CHART_COLORS.activity.stress,
          fontSize,
          maxTicksLimit: isMobile ? 3 : 5,
          drawOnChartArea: false,
        }),
        min: 0,
        max: 100,
      };
    }

    if (selectedMetrics.has('sleepDuration')) {
      scales['y-sleep'] = {
        ...createYAxis({
          display: !isVerySmall,
          position: 'right',
          title: !isMobile ? 'Slaap' : undefined,
          color: CHART_COLORS.activity.sleep,
          fontSize,
          maxTicksLimit,
          drawOnChartArea: false,
        }),
        min: 0,
        max: 12,
      };
    }

    if (selectedMetrics.has('hrvOvernight') || selectedMetrics.has('hrv7DayAvg')) {
      scales['y-hrv'] = createYAxis({
        display: !isVerySmall,
        position: 'right',
        title: !isMobile ? 'HRV (ms)' : undefined,
        color: CHART_COLORS.activity.hrv,
        fontSize,
        maxTicksLimit,
        drawOnChartArea: false,
      });
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: commonPlugins,
      scales,
    };
  }, [selectedMetrics]);

  const toggleMetric = (key: MetricKey) => {
    setSelectedMetrics((prev: Set<MetricKey>) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Get metric value from activity
  const getMetricValue = (activity: DailyActivity, metric: MetricKey): number => {
    switch (metric) {
      case 'steps':
        return activity.steps || 0;
      case 'calories':
        return activity.totalCalories || 0;
      case 'intensityMinutes':
        return activity.intensityMinutes || 0;
      case 'restingHeartRate':
        return activity.heartRateResting || 0;
      case 'maxHeartRate':
        return activity.heartRateMax || 0;
      case 'stressLevel':
        return activity.stressLevel || 0;
      case 'sleepDuration':
        return (activity.sleepSeconds || 0) / 3600; // Convert to hours
      case 'hrvOvernight':
        return activity.hrvOvernight || 0;
      case 'hrv7DayAvg':
        return activity.hrv7DayAvg || 0;
      default:
        return 0;
    }
  };

  // Correlation scatter plot data
  const correlationData = useMemo(() => {
    const xData: number[] = [];
    const yData: number[] = [];
    const labels: string[] = [];

    filteredActivities.forEach((activity: DailyActivity) => {
      const xValue = getMetricValue(activity, correlationMetricX);
      const yValue = getMetricValue(activity, correlationMetricY);

      // Only include if both values are non-zero (valid data)
      if (xValue > 0 && yValue > 0) {
        xData.push(xValue);
        yData.push(yValue);
        labels.push(activity.date);
      }
    });

    if (xData.length === 0) return null;

    const correlation = calculateCorrelation(xData, yData);

    // Create scatter plot data points
    const scatterData = xData.map((x: number, i: number) => ({ x, y: yData[i] }));

    // Calculate regression line (best fit)
    const n = xData.length;
    const sumX = xData.reduce((a: number, b: number) => a + b, 0);
    const sumY = yData.reduce((a: number, b: number) => a + b, 0);
    const sumXY = xData.reduce((sum: number, xi: number, i: number) => sum + xi * yData[i], 0);
    const sumX2 = xData.reduce((sum: number, xi: number) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const minX = Math.min(...xData);
    const maxX = Math.max(...xData);
    const regressionLine = [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept },
    ];

    return {
      correlation,
      scatterData,
      regressionLine,
      dataPoints: xData.length,
    };
  }, [filteredActivities, correlationMetricX, correlationMetricY]);

  const scatterChartData = useMemo(() => {
    if (!correlationData) return null;

    const _xMetric = METRICS.find((m: MetricConfig) => m.key === correlationMetricX);
    const _yMetric = METRICS.find((m: MetricConfig) => m.key === correlationMetricY);

    return {
      datasets: [
        {
          label: 'Data punten',
          data: correlationData.scatterData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          pointRadius: 5,
          pointHoverRadius: 7,
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

  const scatterChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: METRICS.find(m => m.key === correlationMetricX)?.label || '',
        },
      },
      y: {
        title: {
          display: true,
          text: METRICS.find(m => m.key === correlationMetricY)?.label || '',
        },
      },
    },
  };

  return (
    <div>
      {/* Quick Stats Cards */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Ø Stappen</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.avgSteps.toLocaleString()}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">per dag</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Ø Calorieën</div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.avgCalories.toLocaleString()}</div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">kcal/dag</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Ø Intensity Min</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.avgIntensityMinutes}</div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">min/dag</div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
          <div className="text-sm text-pink-600 dark:text-pink-400 font-medium mb-1">Ø Rustpols</div>
          <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">{stats.avgRestingHR}</div>
          <div className="text-xs text-pink-600 dark:text-pink-400 mt-1">bpm</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <div className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">Ø Stress</div>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.avgStress}</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">gemiddeld</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Ø Slaap</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.avgSleep}</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">uur/nacht</div>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 rounded-lg p-4 border border-sky-200 dark:border-sky-800">
          <div className="text-sm text-sky-600 dark:text-sky-400 font-medium mb-1">Ø HRV</div>
          <div className="text-2xl font-bold text-sky-900 dark:text-sky-100">{stats.avgHrvOvernight || '-'}</div>
          <div className="text-xs text-sky-600 dark:text-sky-400 mt-1">ms (overnight)</div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Dagen Data</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.daysWithData}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">van {getPeriodLabel(timeRange)}</div>
        </div>
        </div>
      </div>

      {/* Chart Section */}
      <div>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Activity Trends</h2>

            {/* Period Selector Dropdown */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Laatste 7 dagen</option>
              <option value="14">Laatste 14 dagen</option>
              <option value="28">Laatste 28 dagen</option>
              <option value="90">Laatste 90 dagen</option>
              <option value="this-week">Deze week</option>
              <option value="last-week">Vorige week</option>
              <option value="this-month">Deze maand</option>
              <option value="last-month">Vorige maand</option>
              <option value="all">Alles</option>
            </select>
          </div>

          {/* Metric Toggles */}
          <div className="mt-4 flex flex-wrap gap-2">
            {METRICS.map((metric: MetricConfig) => (
              <button
                key={metric.key}
                onClick={() => toggleMetric(metric.key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${selectedMetrics.has(metric.key)
                    ? 'ring-2 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
                style={selectedMetrics.has(metric.key) ? {
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

        {filteredActivities.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Geen activity data beschikbaar</p>
            <p className="text-sm">Importeer Garmin CSV data om trends te zien</p>
          </div>
        ) : selectedMetrics.size === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Selecteer minimaal één metric</p>
            <p className="text-sm">Klik op de metric buttons hierboven</p>
          </div>
        ) : (
          <>
            <div className="p-6 pb-2 overflow-x-auto">
              <div className="h-[400px] sm:h-[400px] min-w-[320px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
            {/* Mobile hint */}
            <div className="px-6 pb-6 text-xs text-gray-500 dark:text-gray-400 text-center sm:hidden">
              💡 Tip: Tik op de grafiek voor details per datum
            </div>
          </>
        )}
      </div>

      {/* Correlation Analysis */}
      <div>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Correlatie Analyse</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ontdek verbanden tussen verschillende metrics</p>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                X-as (horizontaal)
              </label>
              <select
                value={correlationMetricX}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCorrelationMetricX(e.target.value as MetricKey)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {METRICS.map((metric: MetricConfig) => (
                  <option key={metric.key} value={metric.key}>{metric.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Y-as (verticaal)
              </label>
              <select
                value={correlationMetricY}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCorrelationMetricY(e.target.value as MetricKey)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {METRICS.map((metric: MetricConfig) => (
                  <option key={metric.key} value={metric.key}>{metric.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {correlationData ? (
          <>
            {/* Correlation Stats */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
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
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getPeriodLabel(timeRange)}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Relatie</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {correlationData.correlation > 0 ? '📈 Positief' : '📉 Negatief'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {correlationData.correlation > 0
                        ? 'Als X stijgt, stijgt Y ook'
                        : 'Als X stijgt, daalt Y'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded p-4">
                  <strong>💡 Interpretatie:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {Math.abs(correlationData.correlation) > 0.7 && (
                      <li>Er is een <strong>sterke {correlationData.correlation > 0 ? 'positieve' : 'negatieve'}</strong> relatie tussen deze metrics.</li>
                    )}
                    {Math.abs(correlationData.correlation) > 0.4 && Math.abs(correlationData.correlation) <= 0.7 && (
                      <li>Er is een <strong>matige {correlationData.correlation > 0 ? 'positieve' : 'negatieve'}</strong> relatie tussen deze metrics.</li>
                    )}
                    {Math.abs(correlationData.correlation) <= 0.4 && (
                      <li>Er is <strong>weinig tot geen</strong> direct verband tussen deze metrics.</li>
                    )}
                    <li className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Correlatie betekent niet altijd causatie. Andere factoren kunnen ook een rol spelen.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Scatter Plot */}
            <div className="p-6">
              <div className="h-[400px] sm:h-[500px]">
                <Scatter data={scatterChartData!} options={scatterChartOptions} />
              </div>
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                💡 Elk punt is één dag. De rode lijn toont de algemene trend.
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Onvoldoende data voor correlatie analyse</p>
            <p className="text-sm">Zorg dat je meerdere dagen met beide metrics hebt geregistreerd</p>
          </div>
        )}
      </div>
    </div>
  );
}
