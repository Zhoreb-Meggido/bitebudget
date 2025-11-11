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
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Streefgewicht',
        data: last90Days.map(() => settings.targetWeight),
        borderColor: 'rgb(34, 197, 94)',
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
      },
      title: {
        display: true,
        text: 'Gewichtsontwikkeling (laatste 90 dagen)',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const latestWeight = weights[0];
  const weightDiff = latestWeight ? latestWeight.weight - settings.targetWeight : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gewicht Tracking</h1>
        <p className="text-gray-600 mt-2">Volg je gewichtsontwikkeling</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add/Edit Weight Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Gewicht Bewerken' : 'Gewicht Toevoegen'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datum
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gewicht (kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="78.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notitie (optioneel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Annuleren
                </button>
              )}
            </div>
          </form>

          {/* Current Stats */}
          {latestWeight && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Huidige Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Huidig gewicht:</span>
                  <span className="font-medium">{latestWeight.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Streefgewicht:</span>
                  <span className="font-medium">{settings.targetWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verschil:</span>
                  <span className={`font-medium ${weightDiff > 0 ? 'text-orange-600' : weightDiff < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="h-96">
            {weights.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Geen gewichtsmetingen beschikbaar. Voeg je eerste meting toe!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weight History */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Geschiedenis</h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Laden...</div>
        ) : weights.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nog geen gewichtsmetingen
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gewicht
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verschil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notitie
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weights.map((w, index) => {
                  const prevWeight = weights[index + 1];
                  const diff = prevWeight ? w.weight - prevWeight.weight : 0;

                  return (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(w.date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {w.weight} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {prevWeight && (
                          <span className={diff > 0 ? 'text-orange-600' : diff < 0 ? 'text-green-600' : 'text-gray-500'}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {w.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(w)}
                          className="text-blue-600 hover:text-blue-900 mr-2 text-xl min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                          aria-label="Bewerken"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(w.id!)}
                          className="text-red-600 hover:text-red-900 text-xl min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
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
