import { useMemo, useState } from 'react';
import { useEntries, useActivities, useWeights } from '@/hooks';
import { Line } from 'react-chartjs-2';
import type { Entry, DailyActivity, Weight } from '@/types';
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
import { CHART_COLORS, buildChartOptions, createLineDataset, commonScales } from '@/config/chart.config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DayBalance {
  date: string;
  intake: number;
  expenditure: number;
  balance: number;
}

export function BalanceTab() {
  const { entries } = useEntries();
  const { activities, isLoading: loading } = useActivities();
  const { weights } = useWeights();
  const [timeRange, setTimeRange] = useState<TimeRange>('28');

  // Combine food intake with activity expenditure
  const balanceData = useMemo(() => {
    const dailyIntake = new Map<string, number>();
    const dailyExpenditure = new Map<string, number>();

    // Calculate daily calorie intake
    entries.forEach((entry: Entry) => {
      const current = dailyIntake.get(entry.date) || 0;
      dailyIntake.set(entry.date, current + (entry.calories || 0));
    });

    // Calculate daily calorie expenditure
    activities.forEach((activity: DailyActivity) => {
      dailyExpenditure.set(activity.date, activity.totalCalories || 0);
    });

    // Get all dates (union of both datasets)
    const allDates = new Set([...dailyIntake.keys(), ...dailyExpenditure.keys()]);

    // Calculate balance for each day
    const balance: DayBalance[] = Array.from(allDates).map(date => ({
      date,
      intake: dailyIntake.get(date) || 0,
      expenditure: dailyExpenditure.get(date) || 0,
      balance: (dailyIntake.get(date) || 0) - (dailyExpenditure.get(date) || 0),
    })).sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

    return balance;
  }, [entries, activities]);

  // Calculate stats
  const stats = useMemo(() => {
    if (balanceData.length === 0) return null;

    // Only count days with both intake and expenditure data
    const completeDays = balanceData.filter((d: DayBalance) => d.intake > 0 && d.expenditure > 0);

    if (completeDays.length === 0) return null;

    const totalBalance = completeDays.reduce((sum: number, day: DayBalance) => sum + day.balance, 0);
    const avgBalance = totalBalance / completeDays.length;
    const daysDeficit = completeDays.filter((d: DayBalance) => d.balance < 0).length;
    const daysSurplus = completeDays.filter((d: DayBalance) => d.balance > 0).length;

    return {
      avgBalance: Math.round(avgBalance),
      totalBalance: Math.round(totalBalance),
      daysDeficit,
      daysSurplus,
      totalDays: completeDays.length,
    };
  }, [balanceData]);

  // Weight analysis
  const weightAnalysis = useMemo(() => {
    if (weights.length < 2) return null;

    // Get weights from last 60 days, sorted by date
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const cutoffDate = sixtyDaysAgo.toISOString().split('T')[0];

    const recentWeights = weights
      .filter((w: Weight) => w.date >= cutoffDate && w.weight > 0)
      .sort((a: Weight, b: Weight) => a.date.localeCompare(b.date));

    if (recentWeights.length < 2) return null;

    const firstWeight = recentWeights[0];
    const lastWeight = recentWeights[recentWeights.length - 1];
    const actualWeightChange = lastWeight.weight - firstWeight.weight;

    // Calculate days between measurements
    const startDate = new Date(firstWeight.date);
    const endDate = new Date(lastWeight.date);
    const daysBetween = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysBetween === 0) return null;

    // Calculate expected weight change based on calorie balance
    // Only for days where we have both intake and expenditure data within the weight measurement period
    const balanceInPeriod = balanceData.filter((d: DayBalance) =>
      d.date >= firstWeight.date &&
      d.date <= lastWeight.date &&
      d.intake > 0 &&
      d.expenditure > 0
    );

    if (balanceInPeriod.length === 0) return null;

    const totalDeficit = balanceInPeriod.reduce((sum: number, day: DayBalance) => sum + day.balance, 0);
    // 7700 kcal deficit = 1 kg weight loss (approximately)
    const expectedWeightChange = totalDeficit / 7700;

    // Calculate difference between expected and actual
    const difference = actualWeightChange - expectedWeightChange;
    const accuracyPercentage = expectedWeightChange !== 0
      ? Math.round((actualWeightChange / expectedWeightChange) * 100)
      : 0;

    return {
      firstWeight: firstWeight.weight,
      lastWeight: lastWeight.weight,
      actualWeightChange,
      expectedWeightChange,
      difference,
      accuracyPercentage,
      daysBetween,
      daysTracked: balanceInPeriod.length,
      avgDailyDeficit: Math.round(totalDeficit / balanceInPeriod.length),
    };
  }, [weights, balanceData]);

  // Weight chart data
  const weightChartData = useMemo(() => {
    // Get weights from last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const cutoffDate = sixtyDaysAgo.toISOString().split('T')[0];

    const recentWeights = weights
      .filter((w: Weight) => w.date >= cutoffDate && w.weight > 0)
      .sort((a: Weight, b: Weight) => a.date.localeCompare(b.date));

    if (recentWeights.length === 0) return null;

    const labels = recentWeights.map((w: Weight) => {
      const date = new Date(w.date);
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    });

    // Calculate simple linear trend
    const n = recentWeights.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = recentWeights.reduce((sum: number, w: Weight) => sum + w.weight, 0);
    const sumXY = recentWeights.reduce((sum: number, w: Weight, i: number) => sum + (i * w.weight), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trendLine = recentWeights.map((_: Weight, i: number) => slope * i + intercept);

    return {
      labels,
      datasets: [
        createLineDataset({
          label: 'Gewicht (kg)',
          data: recentWeights.map((w: Weight) => w.weight),
          color: CHART_COLORS.balance.weight,
          borderWidth: 3,
        }),
        createLineDataset({
          label: 'Trend',
          data: trendLine,
          color: CHART_COLORS.balance.trend,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
        }),
      ],
    };
  }, [weights]);

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
        const allDates = balanceData.map((d: DayBalance) => d.date).filter(d => d < today.toISOString().split('T')[0]).sort();
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
  }, [timeRange, balanceData]);

  // Prepare chart data for the selected period (excluding today)
  const chartData = useMemo(() => {
    // Filter data for the selected period, sorted chronologically (oldest first)
    const filteredData = balanceData
      .filter((d: DayBalance) => d.date >= dateRange.startDate && d.date <= dateRange.endDate && d.intake > 0 && d.expenditure > 0)
      .sort((a: DayBalance, b: DayBalance) => a.date.localeCompare(b.date)); // Oldest first for chart

    const labels = filteredData.map((d: DayBalance) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    });

    return {
      labels,
      datasets: [
        createLineDataset({
          label: 'Inname (kcal)',
          data: filteredData.map((d: DayBalance) => d.intake),
          color: CHART_COLORS.balance.intake,
        }),
        createLineDataset({
          label: 'Verbruik (kcal)',
          data: filteredData.map((d: DayBalance) => d.expenditure),
          color: CHART_COLORS.balance.expenditure,
        }),
      ],
    };
  }, [balanceData, dateRange]);

  const chartOptions = buildChartOptions({
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Calorieën',
        },
      },
    },
  });

  const weightChartOptions = buildChartOptions({
    scales: {
      y: commonScales.weight(),
    },
  });

  if (loading) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Laden...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <p>Geen fitness data beschikbaar voor calorie balance.</p>
        <p className="text-sm mt-2">Importeer Garmin CSV bestanden via Data Management.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Calorie Balans:</strong> Inname (voeding) - Verbruik (Garmin).
            Negatief = calorie tekort (afvallen), Positief = calorie overschot (aankomen).
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Dagen Compleet</div>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalDays}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Ø Balans</div>
            <div className={`mt-2 text-3xl font-bold ${stats.avgBalance < 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {stats.avgBalance > 0 ? '+' : ''}{stats.avgBalance}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">kcal/dag</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Dagen Tekort</div>
            <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.daysDeficit}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Dagen Overschot</div>
            <div className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.daysSurplus}</div>
          </div>
          </div>
        </div>
      )}

      {/* Weight Tracking */}
      {weightChartData && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gewicht Tracking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Laatste 60 dagen met trendlijn</p>
          </div>

          <div className="p-6 pb-2">
            <div className="h-[300px] sm:h-[400px]">
              <Line data={weightChartData} options={weightChartOptions} />
            </div>
          </div>

          {/* Weight Analysis */}
          {weightAnalysis && (
            <div className="p-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">📊 Gewicht Analyse</h4>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Actual vs Expected */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">Verwacht vs Werkelijk</h5>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Periode:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{weightAnalysis.daysBetween} dagen ({weightAnalysis.daysTracked} getrackt)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Start gewicht:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{weightAnalysis.firstWeight.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Huidig gewicht:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{weightAnalysis.lastWeight.toFixed(1)} kg</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Werkelijk:</span>
                          <span className={`font-bold ${weightAnalysis.actualWeightChange < 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {weightAnalysis.actualWeightChange > 0 ? '+' : ''}{weightAnalysis.actualWeightChange.toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Verwacht (o.b.v. cal):</span>
                          <span className={`font-bold ${weightAnalysis.expectedWeightChange < 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {weightAnalysis.expectedWeightChange > 0 ? '+' : ''}{weightAnalysis.expectedWeightChange.toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Verschil:</span>
                          <span className={`font-bold ${Math.abs(weightAnalysis.difference) < 0.5 ? 'text-gray-600 dark:text-gray-400' : 'text-purple-600 dark:text-purple-400'}`}>
                            {weightAnalysis.difference > 0 ? '+' : ''}{weightAnalysis.difference.toFixed(2)} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Garmin Accuracy Analysis */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200">Garmin Nauwkeurigheid</h5>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Ø Dagelijks deficit:</span>
                        <span className={`font-bold ${weightAnalysis.avgDailyDeficit < 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {weightAnalysis.avgDailyDeficit} kcal
                        </span>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Interpretatie:</div>
                        {Math.abs(weightAnalysis.difference) < 0.5 ? (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                            <p className="text-sm text-green-800 dark:text-green-300">
                              <strong>✅ Uitstekend!</strong><br />
                              Garmin schatting komt goed overeen met werkelijk gewichtsverlies.
                              Verschil is minimaal (&lt; 0.5kg).
                            </p>
                          </div>
                        ) : weightAnalysis.difference > 0.5 ? (
                          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-3">
                            <p className="text-sm text-orange-800 dark:text-orange-300">
                              <strong>⚠️ Minder afgevallen dan verwacht</strong><br />
                              Mogelijke oorzaken:
                              • Garmin overschat calorieverbruik (~{Math.round((weightAnalysis.difference / weightAnalysis.daysBetween) * 7700)} kcal/dag)<br />
                              • Verborgen calorieën in voeding<br />
                              • Water retentie / spiergroei
                            </p>
                          </div>
                        ) : (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              <strong>💪 Meer afgevallen dan verwacht!</strong><br />
                              Mogelijke oorzaken:
                              • Garmin onderschat verbruik<br />
                              • Extra activiteit niet geregistreerd<br />
                              • Effectief deficit groter dan gedacht
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                  💡 <strong>Tip:</strong> Voor betrouwbare analyse: track minimaal 2-4 weken met consistente metingen en volledige calorie/activiteit data.
                  Kortetermijn schommelingen kunnen worden veroorzaakt door water, voeding in maag, of hormonen.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Balance Chart */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Inname vs Verbruik</h3>

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
        </div>

        {chartData.labels.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Geen complete data beschikbaar</p>
            <p className="text-sm">Zorg dat je zowel voeding als activiteit data hebt voor dezelfde dagen</p>
          </div>
        ) : (
          <>
            <div className="p-6 pb-2">
              <div className="h-[300px] sm:h-[400px]">
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

      {/* Balance Table */}
      <div>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dagelijkse Calorie Balans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Inname</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Verbruik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balans</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {balanceData.slice(0, 30).map((day: DayBalance) => {
                const isComplete = day.intake > 0 && day.expenditure > 0;
                const isDeficit = day.balance < 0;

                return (
                  <tr key={day.date} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${!isComplete ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {new Date(day.date).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {day.intake > 0 ? day.intake : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 dark:text-orange-400 font-medium">
                      {day.expenditure > 0 ? day.expenditure : '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                      !isComplete ? 'text-gray-400' : isDeficit ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {isComplete ? `${day.balance > 0 ? '+' : ''}${day.balance}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!isComplete ? (
                        <span className="text-gray-400">Incompleet</span>
                      ) : isDeficit ? (
                        <span className="text-green-600 dark:text-green-400">✓ Tekort</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">Overschot</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
