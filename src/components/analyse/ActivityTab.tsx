import { useMemo } from 'react';
import { useActivities } from '@/hooks';

export function ActivityTab() {
  const { activities, isLoading: loading } = useActivities();

  const stats = useMemo(() => {
    if (activities.length === 0) return null;

    const total = activities.reduce((acc, activity) => ({
      steps: acc.steps + (activity.steps || 0),
      calories: acc.calories + (activity.totalCalories || 0),
      activeCalories: acc.activeCalories + (activity.activeCalories || 0),
      intensityMinutes: acc.intensityMinutes + (activity.intensityMinutes || 0),
      sleepSeconds: acc.sleepSeconds + (activity.sleepSeconds || 0),
    }), { steps: 0, calories: 0, activeCalories: 0, intensityMinutes: 0, sleepSeconds: 0 });

    return {
      avgSteps: Math.round(total.steps / activities.length),
      avgCalories: Math.round(total.calories / activities.length),
      avgActiveCalories: Math.round(total.activeCalories / activities.length),
      avgIntensityMinutes: Math.round(total.intensityMinutes / activities.length),
      avgSleepHours: (total.sleepSeconds / activities.length / 3600).toFixed(1),
      totalDays: activities.length,
    };
  }, [activities]);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Laden...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Geen fitness data beschikbaar.</p>
        <p className="text-sm mt-2">Importeer Garmin CSV bestanden via Data Management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Dagen</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalDays || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Ø Stappen</div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{stats?.avgSteps.toLocaleString() || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Ø Cal</div>
          <div className="mt-2 text-2xl font-bold text-orange-600">{stats?.avgCalories || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Ø Actief</div>
          <div className="mt-2 text-2xl font-bold text-green-600">{stats?.avgActiveCalories || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Ø Int.min</div>
          <div className="mt-2 text-2xl font-bold text-purple-600">{stats?.avgIntensityMinutes || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Ø Slaap</div>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{stats?.avgSleepHours || 0}u</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recente Activiteit</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stappen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actief</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Int.min</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slaap</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Body Batt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stress</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.slice(0, 30).map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(activity.date).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.steps?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                    {activity.totalCalories || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                    {activity.activeCalories || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-purple-600">
                    {activity.intensityMinutes || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.sleepSeconds ? `${Math.round(activity.sleepSeconds / 3600)}u ${Math.round((activity.sleepSeconds % 3600) / 60)}m` : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600">
                    {activity.bodyBattery || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.stressLevel || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
