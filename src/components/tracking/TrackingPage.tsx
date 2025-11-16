import { useState } from 'react';
import { useWeights, useSettings } from '@/hooks';
import type { Weight } from '@/types';
import { getTodayDate } from '@/utils/date.utils';
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
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function TrackingPage() {
  const { weights, addWeight, updateWeight, deleteWeight, isLoading } = useWeights();
  const { settings } = useSettings();

  const [date, setDate] = useState(getTodayDate());
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      alert('Voer een geldig gewicht in');
      return;
    }

    try {
      if (editingId) {
        await updateWeight(editingId, {
          date,
          weight: weightValue,
          note: note.trim() || undefined,
        });
        setEditingId(null);
      } else {
        await addWeight({
          date,
          weight: weightValue,
          note: note.trim() || undefined,
        });
      }

      // Reset form
      setDate(getTodayDate());
      setWeight('');
      setNote('');
    } catch (error) {
      console.error('Failed to save weight:', error);
      alert('Fout bij opslaan van gewicht');
    }
  };

  const handleEdit = (w: Weight) => {
    setEditingId(w.id!);
    setDate(w.date);
    setWeight(w.weight.toString());
    setNote(w.note || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze gewichtsmeting wilt verwijderen?')) {
      return;
    }

    try {
      await deleteWeight(id);
    } catch (error) {
      console.error('Failed to delete weight:', error);
      alert('Fout bij verwijderen van gewicht');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDate(getTodayDate());
    setWeight('');
    setNote('');
  };

  // Prepare chart data (last 90 days)
  const last90Days = weights.slice(0, 90).reverse();
  const chartData = {
    labels: last90Days.map(w => {
      const d = new Date(w.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }),
    datasets: [
      {
        label: 'Gewicht (kg)',
        data: last90Days.map(w => w.weight),
        borderColor: isDarkMode ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
        backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Streefgewicht',
        data: last90Days.map(() => settings.targetWeight),
        borderColor: isDarkMode ? 'rgb(74, 222, 128)' : 'rgb(34, 197, 94)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode ? 'rgb(229, 231, 235)' : 'rgb(31, 41, 55)',
        },
      },
      title: {
        display: true,
        text: 'Gewichtsontwikkeling (laatste 90 dagen)',
        color: isDarkMode ? 'rgb(229, 231, 235)' : 'rgb(31, 41, 55)',
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
        },
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 1)',
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          color: isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
        },
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 1)',
        },
      },
    },
  };

  const latestWeight = weights[0];
  const weightDiff = latestWeight ? latestWeight.weight - settings.targetWeight : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gewicht Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Volg je gewichtsontwikkeling</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add/Edit Weight Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingId ? 'Gewicht Bewerken' : 'Gewicht Toevoegen'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Datum
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gewicht (kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="78.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notitie (optioneel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Eventuele opmerkingen..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
              >
                {editingId ? 'Bijwerken' : 'Toevoegen'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Annuleren
                </button>
              )}
            </div>
          </form>

          {/* Current Stats */}
          {latestWeight && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Huidige Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Huidig gewicht:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{latestWeight.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Streefgewicht:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{settings.targetWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Verschil:</span>
                  <span className={`font-medium ${weightDiff > 0 ? 'text-orange-600 dark:text-orange-400' : weightDiff < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
                  </span>
                </div>

                {/* Body Composition Metrics */}
                {(latestWeight.bodyFat || latestWeight.boneMass || latestWeight.bmr) && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lichaamssamenstelling</p>
                    {latestWeight.bodyFat && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Vetpercentage:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{latestWeight.bodyFat.toFixed(1)}%</span>
                      </div>
                    )}
                    {latestWeight.boneMass && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Botmassa:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{latestWeight.boneMass.toFixed(2)} kg</span>
                      </div>
                    )}
                    {latestWeight.bmr && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">BMR:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{latestWeight.bmr} kcal</span>
                      </div>
                    )}
                  </>
                )}

                {/* Source indicator */}
                {latestWeight.source && (
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Bron: {latestWeight.source === 'health_connect' ? 'Health Connect' : 'Handmatig'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="h-96">
            {weights.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Geen gewichtsmetingen beschikbaar. Voeg je eerste meting toe!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weight History */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Geschiedenis</h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">Laden...</div>
        ) : weights.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Nog geen gewichtsmetingen
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gewicht
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Verschil
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vet %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Botmassa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    BMR
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Notitie
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {weights.map((w, index) => {
                  const prevWeight = weights[index + 1];
                  const diff = prevWeight ? w.weight - prevWeight.weight : 0;

                  return (
                    <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(w.date).toLocaleDateString('nl-NL')}
                        {w.source && (
                          <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {w.source === 'health_connect' ? '📱 HC' : '✍️'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {w.weight} kg
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {prevWeight && (
                          <span className={diff > 0 ? 'text-orange-600 dark:text-orange-400' : diff < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {w.bodyFat ? `${w.bodyFat.toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {w.boneMass ? `${w.boneMass.toFixed(2)} kg` : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {w.bmr ? `${w.bmr} kcal` : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {w.note || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(w)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-2 text-xl min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                          aria-label="Bewerken"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(w.id!)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-xl min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                          aria-label="Verwijderen"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
