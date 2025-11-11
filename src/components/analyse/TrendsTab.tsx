import { useState, useMemo } from 'react';
import { useActivities } from '@/hooks';
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
  { key: 'steps', label: 'Stappen', color: 'rgb(59, 130, 246)', unit: '' },
  { key: 'calories', label: 'Calorie Verbruik', color: 'rgb(239, 68, 68)', unit: 'kcal' },
  { key: 'intensityMinutes', label: 'Intensity Minutes', color: 'rgb(147, 51, 234)', unit: 'min' },
  { key: 'restingHeartRate', label: 'Rustpols', color: 'rgb(14, 165, 233)', unit: 'bpm' },
  { key: 'maxHeartRate', label: 'Max Hartslag', color: 'rgb(220, 38, 38)', unit: 'bpm' },
  { key: 'stressLevel', label: 'Stress Level', color: 'rgb(245, 158, 11)', unit: '' },
  { key: 'sleepDuration', label: 'Slaap Duur', color: 'rgb(34, 197, 94)', unit: 'uur' },
  { key: 'hrvOvernight', label: 'HRV Overnight', color: 'rgb(14, 165, 233)', unit: 'ms' },
  { key: 'hrv7DayAvg', label: 'HRV 7d Gem', color: 'rgb(6, 182, 212)', unit: 'ms' },
];

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

export function TrendsTab() {
  const { activities } = useActivities();
  const [selectedMetrics, setSelectedMetrics] = useState<Set<MetricKey>>(
    new Set(['steps', 'calories', 'intensityMinutes'])
  );
  const [period, setPeriod] = useState<7 | 14 | 30 | 90>(30);
  const [correlationMetricX, setCorrelationMetricX] = useState<MetricKey>('steps');
  const [correlationMetricY, setCorrelationMetricY] = useState<MetricKey>('calories');

  // Filter activities by period
  const filteredActivities = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    return activities
      .filter(a => a.date >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activities, period]);

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

    const sum = filteredActivities.reduce((acc, day) => ({
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
    const labels = filteredActivities.map(a => {
      const date = new Date(a.date);
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    });

    const datasets = METRICS
      .filter(metric => selectedMetrics.has(metric.key))
      .map(metric => {
        let data: number[];
        let yAxisID: string;

        switch (metric.key) {
          case 'steps':
            data = filteredActivities.map(a => a.steps || 0);
            yAxisID = 'y-steps';
            break;
          case 'calories':
            data = filteredActivities.map(a => a.totalCalories || 0);
            yAxisID = 'y-calories';
            break;
          case 'intensityMinutes':
            data = filteredActivities.map(a => a.intensityMinutes || 0);
            yAxisID = 'y-minutes';
            break;
          case 'restingHeartRate':
            data = filteredActivities.map(a => a.heartRateResting || 0);
            yAxisID = 'y-heartrate';
            break;
          case 'maxHeartRate':
            data = filteredActivities.map(a => a.heartRateMax || 0);
            yAxisID = 'y-heartrate';
            break;
          case 'stressLevel':
            data = filteredActivities.map(a => a.stressLevel || 0);
            yAxisID = 'y-stress';
            break;
          case 'sleepDuration':
            data = filteredActivities.map(a => (a.sleepSeconds || 0) / 3600); // Convert to hours
            yAxisID = 'y-sleep';
            break;
          case 'hrvOvernight':
            data = filteredActivities.map(a => a.hrvOvernight || 0);
            yAxisID = 'y-hrv';
            break;
          case 'hrv7DayAvg':
            data = filteredActivities.map(a => a.hrv7DayAvg || 0);
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
    // Detect mobile for responsive Y-axes
    const isMobile = window.innerWidth < 768;
    const isVerySmall = window.innerWidth < 640;

    // Build scales dynamically based on selected metrics
    const scales: any = {
      x: {
        grid: {
          display: false,
        },
      },
    };

    // Add Y-axis for each selected metric
    if (selectedMetrics.has('steps')) {
      scales['y-steps'] = {
        type: 'linear',
        display: !isVerySmall, // Hide on very small screens
        position: 'left',
        beginAtZero: true,
        title: {
          display: !isMobile, // Hide title on mobile
          text: 'Stappen',
          color: 'rgb(59, 130, 246)',
          font: { size: isMobile ? 10 : 12 },
        },
        ticks: {
          color: 'rgb(59, 130, 246)',
          font: { size: isMobile ? 9 : 11 },
          maxTicksLimit: isMobile ? 4 : 6,
        },
        grid: {
          color: 'rgba(59, 130, 246, 0.1)',
        },
      };
    }

    if (selectedMetrics.has('calories')) {
      scales['y-calories'] = {
        type: 'linear',
        display: !isVerySmall,
        position: 'right',
        beginAtZero: true,
        title: {
          display: !isMobile,
          text: 'Cal',
          color: 'rgb(239, 68, 68)',
          font: { size: isMobile ? 10 : 12 },
        },
        ticks: {
          color: 'rgb(239, 68, 68)',
          font: { size: isMobile ? 9 : 11 },
          maxTicksLimit: isMobile ? 4 : 6,
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    }

    if (selectedMetrics.has('intensityMinutes')) {
      scales['y-minutes'] = {
        type: 'linear',
        display: !isVerySmall,
        position: 'right',
        beginAtZero: true,
        title: {
          display: !isMobile,
          text: 'Int',
          color: 'rgb(147, 51, 234)',
          font: { size: isMobile ? 10 : 12 },
        },
        ticks: {
          color: 'rgb(147, 51, 234)',
          font: { size: isMobile ? 9 : 11 },
          maxTicksLimit: isMobile ? 4 : 6,
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    }

    if (selectedMetrics.has('restingHeartRate') || selectedMetrics.has('maxHeartRate')) {
      scales['y-heartrate'] = {
        type: 'linear',
        display: !isVerySmall,
        position: 'right',
        min: 40,
        max: 220,
        title: {
          display: !isMobile,
          text: 'Hartslag (bpm)',
          color: 'rgb(107, 114, 128)',
          font: { size: isMobile ? 10 : 12 },
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: { size: isMobile ? 9 : 11 },
          maxTicksLimit: isMobile ? 4 : 6,
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    }

    if (selectedMetrics.has('stressLevel')) {
      scales['y-stress'] = {
        type: 'linear',
        display: !isVerySmall,
        position: 'right',
        min: 0,
        max: 100,
        title: {
          display: !isMobile,
          text: 'Stress',
          color: 'rgb(245, 158, 11)',
          font: { size: isMobile ? 10 : 12 },
        },
        ticks: {
          color: 'rgb(245, 158, 11)',
          font: { size: isMobile ? 9 : 11 },
          maxTicksLimit: isMobile ? 3 : 5,
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    }

    if (selectedMetrics.has('sleepDuration')) {
      scales['y-sleep'] = {
        type: 'linear',
        display: !isVerySmall,
        position: 'right',
        min: 0,
        max: 12,
        title: {
          display: !isMobile,
          text: 'Slaap',
          color: 'rgb(34, 197, 94)',
          font: { size: isMobile ? 10 : 12 },
        },
        ticks: {
          color: 'rgb(34, 197, 94)',
          font: { size: isMobile ? 9 : 11 },
          maxTicksLimit: isMobile ? 4 : 6,
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    }

    if (selectedMetrics.has('hrvOvernight') || selectedMetrics.has('hrv7DayAvg')) {
      scales['y-hrv'] = {
        type: 'linear',
        display: !isVerySmall,
        position: 'right',
        beginAtZero: true,
        title: {
          display: !isMobile,
          text: 'HRV (ms)',
          color: 'rgb(14, 165, 233)',
          font: { size: isMobile ? 10 : 12 },
        },
        ticks: {
          color: 'rgb(14, 165, 233)',
          font: { size: isMobile ? 9 : 11 },
          maxTicksLimit: isMobile ? 4 : 6,
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
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
      scales,
    };
  }, [selectedMetrics]);

  const toggleMetric = (key: MetricKey) => {
    setSelectedMetrics(prev => {
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
  const getMetricValue = (activity: typeof activities[0], metric: MetricKey): number => {
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

    filteredActivities.forEach(activity => {
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
    const scatterData = xData.map((x, i) => ({ x, y: yData[i] }));

    // Calculate regression line (best fit)
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

    return {
      correlation,
      scatterData,
      regressionLine,
      dataPoints: xData.length,
    };
  }, [filteredActivities, correlationMetricX, correlationMetricY]);

  const scatterChartData = useMemo(() => {
    if (!correlationData) return null;

    const xMetric = METRICS.find(m => m.key === correlationMetricX);
    const yMetric = METRICS.find(m => m.key === correlationMetricY);

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
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Ø Stappen</div>
          <div className="text-2xl font-bold text-blue-900">{stats.avgSteps.toLocaleString()}</div>
          <div className="text-xs text-blue-600 mt-1">per dag</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-600 font-medium mb-1">Ø Calorieën</div>
          <div className="text-2xl font-bold text-red-900">{stats.avgCalories.toLocaleString()}</div>
          <div className="text-xs text-red-600 mt-1">kcal/dag</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-medium mb-1">Ø Intensity Min</div>
          <div className="text-2xl font-bold text-purple-900">{stats.avgIntensityMinutes}</div>
          <div className="text-xs text-purple-600 mt-1">min/dag</div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
          <div className="text-sm text-pink-600 font-medium mb-1">Ø Rustpols</div>
          <div className="text-2xl font-bold text-pink-900">{stats.avgRestingHR}</div>
          <div className="text-xs text-pink-600 mt-1">bpm</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="text-sm text-amber-600 font-medium mb-1">Ø Stress</div>
          <div className="text-2xl font-bold text-amber-900">{stats.avgStress}</div>
          <div className="text-xs text-amber-600 mt-1">gemiddeld</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Ø Slaap</div>
          <div className="text-2xl font-bold text-green-900">{stats.avgSleep}</div>
          <div className="text-xs text-green-600 mt-1">uur/nacht</div>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg p-4 border border-sky-200">
          <div className="text-sm text-sky-600 font-medium mb-1">Ø HRV</div>
          <div className="text-2xl font-bold text-sky-900">{stats.avgHrvOvernight || '-'}</div>
          <div className="text-xs text-sky-600 mt-1">ms (overnight)</div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 font-medium mb-1">Dagen Data</div>
          <div className="text-2xl font-bold text-gray-900">{stats.daysWithData}</div>
          <div className="text-xs text-gray-600 mt-1">van {period}</div>
        </div>
        </div>
      </div>

      {/* Chart Section */}
      <div>
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Activity Trends</h2>

            {/* Period Selector */}
            <div className="flex gap-2">
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setPeriod(days as typeof period)}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-colors
                    ${period === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Metric Toggles */}
          <div className="mt-4 flex flex-wrap gap-2">
            {METRICS.map(metric => (
              <button
                key={metric.key}
                onClick={() => toggleMetric(metric.key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${selectedMetrics.has(metric.key)
                    ? 'ring-2 shadow-sm'
                    : 'opacity-50 hover:opacity-75'
                  }
                `}
                style={{
                  backgroundColor: selectedMetrics.has(metric.key) ? metric.color + '15' : '#f3f4f6',
                  color: selectedMetrics.has(metric.key) ? metric.color : '#6b7280',
                  ringColor: metric.color,
                }}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-lg mb-2">Geen activity data beschikbaar</p>
            <p className="text-sm">Importeer Garmin CSV data om trends te zien</p>
          </div>
        ) : selectedMetrics.size === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-lg mb-2">Selecteer minimaal één metric</p>
            <p className="text-sm">Klik op de metric buttons hierboven</p>
          </div>
        ) : (
          <>
            <div className="p-6 pb-2">
              <div className="h-[400px] sm:h-[400px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
            {/* Mobile hint */}
            <div className="px-6 pb-6 text-xs text-gray-500 text-center sm:hidden">
              💡 Tip: Tik op de grafiek voor details per datum
            </div>
          </>
        )}
      </div>

      {/* Correlation Analysis */}
      <div>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Correlatie Analyse</h2>
          <p className="text-sm text-gray-600 mt-1">Ontdek verbanden tussen verschillende metrics</p>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X-as (horizontaal)
              </label>
              <select
                value={correlationMetricX}
                onChange={(e) => setCorrelationMetricX(e.target.value as MetricKey)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {METRICS.map(metric => (
                  <option key={metric.key} value={metric.key}>{metric.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Y-as (verticaal)
              </label>
              <select
                value={correlationMetricY}
                onChange={(e) => setCorrelationMetricY(e.target.value as MetricKey)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {METRICS.map(metric => (
                  <option key={metric.key} value={metric.key}>{metric.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {correlationData ? (
          <>
            {/* Correlation Stats */}
            <div className="p-6 border-b border-gray-200">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Correlatie Coëfficiënt</div>
                    <div className={`text-4xl font-bold ${
                      Math.abs(correlationData.correlation) > 0.7 ? 'text-green-600' :
                      Math.abs(correlationData.correlation) > 0.4 ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {correlationData.correlation.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.abs(correlationData.correlation) > 0.7 ? '✅ Sterke correlatie' :
                       Math.abs(correlationData.correlation) > 0.4 ? '⚠️ Matige correlatie' :
                       '❌ Zwakke correlatie'}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Data Punten</div>
                    <div className="text-4xl font-bold text-blue-600">
                      {correlationData.dataPoints}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Laatste {period} dagen
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Relatie</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {correlationData.correlation > 0 ? '📈 Positief' : '📉 Negatief'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {correlationData.correlation > 0
                        ? 'Als X stijgt, stijgt Y ook'
                        : 'Als X stijgt, daalt Y'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-sm text-gray-700 bg-white rounded p-4">
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
                    <li className="text-xs text-gray-500 mt-2">
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
              <div className="mt-4 text-xs text-gray-500 text-center">
                💡 Elk punt is één dag. De rode lijn toont de algemene trend.
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p className="text-lg mb-2">Onvoldoende data voor correlatie analyse</p>
            <p className="text-sm">Zorg dat je meerdere dagen met beide metrics hebt geregistreerd</p>
          </div>
        )}
      </div>
    </div>
  );
}
