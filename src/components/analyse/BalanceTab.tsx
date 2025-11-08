import { useMemo, useState } from 'react';
import { useEntries, useActivities } from '@/hooks';
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
  const [chartPeriod, setChartPeriod] = useState<7 | 14 | 30>(30);

  // Combine food intake with activity expenditure
  const balanceData = useMemo(() => {
    const dailyIntake = new Map<string, number>();
    const dailyExpenditure = new Map<string, number>();

    // Calculate daily calorie intake
    entries.forEach(entry => {
      const current = dailyIntake.get(entry.date) || 0;
      dailyIntake.set(entry.date, current + (entry.calories || 0));
    });

    // Calculate daily calorie expenditure
    activities.forEach(activity => {
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
    const completeDays = balanceData.filter(d => d.intake > 0 && d.expenditure > 0);

    if (completeDays.length === 0) return null;

    const totalBalance = completeDays.reduce((sum, day) => sum + day.balance, 0);
    const avgBalance = totalBalance / completeDays.length;
    const daysDeficit = completeDays.filter(d => d.balance < 0).length;
    const daysSurplus = completeDays.filter(d => d.balance > 0).length;

    return {
      avgBalance: Math.round(avgBalance),
      totalBalance: Math.round(totalBalance),
      daysDeficit,
      daysSurplus,
      totalDays: completeDays.length,
    };
  }, [balanceData]);

  // Prepare chart data for the selected period
  const chartData = useMemo(() => {
    // Filter data for the selected period, sorted chronologically (oldest first)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - chartPeriod);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    const filteredData = balanceData
      .filter(d => d.date >= cutoff && d.intake > 0 && d.expenditure > 0)
      .sort((a, b) => a.date.localeCompare(b.date)); // Oldest first for chart

    const labels = filteredData.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Inname (kcal)',
          data: filteredData.map(d => d.intake),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Verbruik (kcal)',
          data: filteredData.map(d => d.expenditure),
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
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Calorie Balance:</strong> Inname (voeding) - Verbruik (Garmin).
          Negatief = calorie tekort (afvallen), Positief = calorie overschot (aankomen).
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Dagen Compleet</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalDays}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Ø Balance</div>
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
      )}

      {/* Balance Chart */}
      <div className="bg-white rounded-lg shadow">
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

        <div className="p-6">
          {chartData.labels.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Geen complete data beschikbaar</p>
              <p className="text-sm">Zorg dat je zowel voeding als activiteit data hebt voor dezelfde dagen</p>
            </div>
          ) : (
            <>
              <div className="h-[300px] sm:h-[400px]">
                <Line data={chartData} options={chartOptions} />
              </div>
              {/* Mobile hint */}
              <div className="mt-4 text-xs text-gray-500 text-center sm:hidden">
                💡 Tip: Tik op de grafiek voor details per datum
              </div>
            </>
          )}
        </div>
      </div>

      {/* Balance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Dagelijkse Calorie Balance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inname</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verbruik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {balanceData.slice(0, 30).map((day) => {
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
