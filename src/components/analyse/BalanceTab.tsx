import { useMemo, useState } from 'react';
import { useEntries, useActivities, useWeights } from '@/hooks';
import { Line } from 'react-chartjs-2';
import type { Entry, DailyActivity, Weight } from '@/types';
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
  const [chartPeriod, setChartPeriod] = useState<7 | 14 | 30>(30);

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
        {
          label: 'Gewicht (kg)',
          data: recentWeights.map((w: Weight) => w.weight),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          borderWidth: 3,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Trend',
          data: trendLine,
          borderColor: 'rgba(239, 68, 68, 0.5)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    };
  }, [weights]);

  // Prepare chart data for the selected period
  const chartData = useMemo(() => {
    // Filter data for the selected period, sorted chronologically (oldest first)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - chartPeriod);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    const filteredData = balanceData
      .filter((d: DayBalance) => d.date >= cutoff && d.intake > 0 && d.expenditure > 0)
      .sort((a: DayBalance, b: DayBalance) => a.date.localeCompare(b.date)); // Oldest first for chart

    const labels = filteredData.map((d: DayBalance) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Inname (kcal)',
          data: filteredData.map((d: DayBalance) => d.intake),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Verbruik (kcal)',
          data: filteredData.map((d: DayBalance) => d.expenditure),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          fill: false,
        },
      ],
    };
  }, [balanceData, chartPeriod]);

  const chartOptions = {
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
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Calorieën',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const weightChartOptions = {
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
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Gewicht (kg)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Laden...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Geen fitness data beschikbaar voor calorie balance.</p>
        <p className="text-sm mt-2">Importeer Garmin CSV bestanden via Data Management.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-6 border-b border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Calorie Balans:</strong> Inname (voeding) - Verbruik (Garmin).
            Negatief = calorie tekort (afvallen), Positief = calorie overschot (aankomen).
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Dagen Compleet</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalDays}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Ø Balans</div>
            <div className={`mt-2 text-3xl font-bold ${stats.avgBalance < 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {stats.avgBalance > 0 ? '+' : ''}{stats.avgBalance}
            </div>
            <div className="text-xs text-gray-500 mt-1">kcal/dag</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Dagen Tekort</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{stats.daysDeficit}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Dagen Overschot</div>
            <div className="mt-2 text-3xl font-bold text-orange-600">{stats.daysSurplus}</div>
          </div>
          </div>
        </div>
      )}

      {/* Weight Tracking */}
      {weightChartData && (
        <div className="border-b border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Gewicht Tracking</h3>
            <p className="text-sm text-gray-600 mt-1">Laatste 60 dagen met trendlijn</p>
          </div>

          <div className="p-6 pb-2">
            <div className="h-[300px] sm:h-[400px]">
              <Line data={weightChartData} options={weightChartOptions} />
            </div>
          </div>

          {/* Weight Analysis */}
          {weightAnalysis && (
            <div className="p-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">📊 Gewicht Analyse</h4>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Actual vs Expected */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-800">Verwacht vs Werkelijk</h5>

                    <div className="bg-white rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Periode:</span>
                        <span className="font-medium">{weightAnalysis.daysBetween} dagen ({weightAnalysis.daysTracked} getrackt)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start gewicht:</span>
                        <span className="font-medium">{weightAnalysis.firstWeight.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Huidig gewicht:</span>
                        <span className="font-medium">{weightAnalysis.lastWeight.toFixed(1)} kg</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Werkelijk:</span>
                          <span className={`font-bold ${weightAnalysis.actualWeightChange < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {weightAnalysis.actualWeightChange > 0 ? '+' : ''}{weightAnalysis.actualWeightChange.toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600">Verwacht (o.b.v. cal):</span>
                          <span className={`font-bold ${weightAnalysis.expectedWeightChange < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {weightAnalysis.expectedWeightChange > 0 ? '+' : ''}{weightAnalysis.expectedWeightChange.toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600">Verschil:</span>
                          <span className={`font-bold ${Math.abs(weightAnalysis.difference) < 0.5 ? 'text-gray-600' : 'text-purple-600'}`}>
                            {weightAnalysis.difference > 0 ? '+' : ''}{weightAnalysis.difference.toFixed(2)} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Garmin Accuracy Analysis */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-800">Garmin Nauwkeurigheid</h5>

                    <div className="bg-white rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Ø Dagelijks deficit:</span>
                        <span className={`font-bold ${weightAnalysis.avgDailyDeficit < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {weightAnalysis.avgDailyDeficit} kcal
                        </span>
                      </div>

                      <div className="border-t pt-3">
                        <div className="text-sm text-gray-700 mb-2">Interpretatie:</div>
                        {Math.abs(weightAnalysis.difference) < 0.5 ? (
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-sm text-green-800">
                              <strong>✅ Uitstekend!</strong><br />
                              Garmin schatting komt goed overeen met werkelijk gewichtsverlies.
                              Verschil is minimaal (&lt; 0.5kg).
                            </p>
                          </div>
                        ) : weightAnalysis.difference > 0.5 ? (
                          <div className="bg-orange-50 border border-orange-200 rounded p-3">
                            <p className="text-sm text-orange-800">
                              <strong>⚠️ Minder afgevallen dan verwacht</strong><br />
                              Mogelijke oorzaken:
                              • Garmin overschat calorieverbruik (~{Math.round((weightAnalysis.difference / weightAnalysis.daysBetween) * 7700)} kcal/dag)<br />
                              • Verborgen calorieën in voeding<br />
                              • Water retentie / spiergroei
                            </p>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-sm text-blue-800">
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

                <div className="mt-4 text-xs text-gray-500 border-t pt-4">
                  💡 <strong>Tip:</strong> Voor betrouwbare analyse: track minimaal 2-4 weken met consistente metingen en volledige calorie/activiteit data.
                  Kortetermijn schommelingen kunnen worden veroorzaakt door water, voeding in maag, of hormonen.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Balance Chart */}
      <div className="border-b border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Inname vs Verbruik</h3>

            {/* Period Selector */}
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setChartPeriod(days as typeof chartPeriod)}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-colors
                    ${chartPeriod === days
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
        </div>

        {chartData.labels.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
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
            <div className="px-6 pb-6 text-xs text-gray-500 text-center sm:hidden">
              💡 Tip: Tik op de grafiek voor details per datum
            </div>
          </>
        )}
      </div>

      {/* Balance Table */}
      <div>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Dagelijkse Calorie Balans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inname</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verbruik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balans</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {balanceData.slice(0, 30).map((day: DayBalance) => {
                const isComplete = day.intake > 0 && day.expenditure > 0;
                const isDeficit = day.balance < 0;

                return (
                  <tr key={day.date} className={`hover:bg-gray-50 ${!isComplete ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(day.date).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                      {day.intake > 0 ? day.intake : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                      {day.expenditure > 0 ? day.expenditure : '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                      !isComplete ? 'text-gray-400' : isDeficit ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {isComplete ? `${day.balance > 0 ? '+' : ''}${day.balance}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!isComplete ? (
                        <span className="text-gray-400">Incompleet</span>
                      ) : isDeficit ? (
                        <span className="text-green-600">✓ Tekort</span>
                      ) : (
                        <span className="text-orange-600">Overschot</span>
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
