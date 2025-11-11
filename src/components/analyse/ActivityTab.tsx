import { useMemo, useState } from 'react';
import { useActivities } from '@/hooks';

type ActivityMetric = 'steps' | 'calories' | 'intensityMinutes' | 'sleep' | 'bodyBattery' | 'stress';

// Helper function to calculate ISO week number
function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday = 0
  target.setDate(target.getDate() - dayNr + 3); // Thursday in current week
  const firstThursday = target.valueOf();
  target.setMonth(0, 1); // First day of year
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7); // First Thursday of year
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export function ActivityTab() {
  const { activities, isLoading: loading } = useActivities();
  const [selectedMetric, setSelectedMetric] = useState<ActivityMetric>('steps');
  const [showTable, setShowTable] = useState(false);

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

  // Weekday patterns (last 60 days)
  const weekdayPatterns = useMemo(() => {
    const weekdays = {
      1: { name: 'Maandag', activities: [] as typeof activities, emoji: '💼' },
      2: { name: 'Dinsdag', activities: [] as typeof activities, emoji: '💼' },
      3: { name: 'Woensdag', activities: [] as typeof activities, emoji: '💼' },
      4: { name: 'Donderdag', activities: [] as typeof activities, emoji: '💼' },
      5: { name: 'Vrijdag', activities: [] as typeof activities, emoji: '🎉' },
      6: { name: 'Zaterdag', activities: [] as typeof activities, emoji: '🏖️' },
      0: { name: 'Zondag', activities: [] as typeof activities, emoji: '😴' }
    };

    // Get last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const cutoffDate = sixtyDaysAgo.toISOString().split('T')[0];

    activities
      .filter(a => a.date >= cutoffDate)
      .forEach(activity => {
        const date = new Date(activity.date + 'T12:00:00');
        const dayOfWeek = date.getDay();
        weekdays[dayOfWeek as keyof typeof weekdays].activities.push(activity);
      });

    return weekdays;
  }, [activities]);

  // Heatmap data (8 weeks)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const weeks: Array<Array<{ date: string; activity?: typeof activities[0] }>> = [];

    // Create data map for quick lookup
    const dataMap = new Map(activities.map(a => [a.date, a]));

    // Generate 8 weeks
    for (let weekIndex = 0; weekIndex < 8; weekIndex++) {
      const week: Array<{ date: string; activity?: typeof activities[0] }> = [];

      // Calculate Monday of this week in UTC
      const currentDayUTC = new Date(todayUTC);
      const dayOfWeek = currentDayUTC.getUTCDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayUTC = Date.UTC(
        currentDayUTC.getUTCFullYear(),
        currentDayUTC.getUTCMonth(),
        currentDayUTC.getUTCDate() - (weekIndex * 7) - daysToMonday
      );

      // Generate 7 days (Monday - Sunday)
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayUTC = new Date(mondayUTC);
        dayUTC.setUTCDate(dayUTC.getUTCDate() + dayIndex);
        const dateStr = dayUTC.toISOString().split('T')[0];

        week.push({
          date: dateStr,
          activity: dataMap.get(dateStr),
        });
      }

      weeks.push(week);
    }

    return weeks.reverse(); // Oldest week first
  }, [activities]);

  // Get color for metric value
  const getColor = (metric: ActivityMetric, activity?: typeof activities[0]): string => {
    if (!activity) return 'bg-gray-200';

    switch (metric) {
      case 'steps': {
        const steps = activity.steps || 0;
        if (steps >= 10000) return 'bg-green-500';
        if (steps >= 7000) return 'bg-yellow-500';
        if (steps > 0) return 'bg-red-500';
        return 'bg-gray-200';
      }
      case 'calories': {
        const cal = activity.totalCalories || 0;
        if (cal >= 2500) return 'bg-green-500';
        if (cal >= 2000) return 'bg-yellow-500';
        if (cal > 0) return 'bg-red-500';
        return 'bg-gray-200';
      }
      case 'intensityMinutes': {
        const mins = activity.intensityMinutes || 0;
        if (mins >= 30) return 'bg-green-500';
        if (mins >= 15) return 'bg-yellow-500';
        if (mins > 0) return 'bg-red-500';
        return 'bg-gray-200';
      }
      case 'sleep': {
        const hours = (activity.sleepSeconds || 0) / 3600;
        if (hours >= 7) return 'bg-green-500';
        if (hours >= 6) return 'bg-yellow-500';
        if (hours > 0) return 'bg-red-500';
        return 'bg-gray-200';
      }
      case 'bodyBattery': {
        const bb = activity.bodyBattery || 0;
        if (bb >= 75) return 'bg-green-500';
        if (bb >= 50) return 'bg-yellow-500';
        if (bb > 0) return 'bg-red-500';
        return 'bg-gray-200';
      }
      case 'stress': {
        const stress = activity.stressLevel || 0;
        if (stress === 0) return 'bg-gray-200';
        if (stress <= 30) return 'bg-green-500';
        if (stress <= 50) return 'bg-yellow-500';
        return 'bg-red-500';
      }
      default:
        return 'bg-gray-200';
    }
  };

  const metricLabels: Record<ActivityMetric, string> = {
    steps: 'Stappen',
    calories: 'Calorieën',
    intensityMinutes: 'Intensity Minutes',
    sleep: 'Slaap',
    bodyBattery: 'Body Battery',
    stress: 'Stress Level',
  };

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
    <div>
      {/* Stats Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Dagen</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{stats?.totalDays || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Ø Stappen</div>
          <div className="mt-2 text-xl font-bold text-blue-600">{stats?.avgSteps.toLocaleString() || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Ø Cal</div>
          <div className="mt-2 text-xl font-bold text-orange-600">{stats?.avgCalories || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Ø Actief</div>
          <div className="mt-2 text-xl font-bold text-green-600">{stats?.avgActiveCalories || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Ø Int.min</div>
          <div className="mt-2 text-xl font-bold text-purple-600">{stats?.avgIntensityMinutes || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Ø Slaap</div>
          <div className="mt-2 text-xl font-bold text-indigo-600">{stats?.avgSleepHours || 0}u</div>
        </div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="border-b border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Activiteit Kalender</h2>

          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as ActivityMetric)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="steps">Stappen</option>
            <option value="calories">Calorieën</option>
            <option value="intensityMinutes">Intensity Minutes</option>
            <option value="sleep">Slaap</option>
            <option value="bodyBattery">Body Battery</option>
            <option value="stress">Stress Level</option>
          </select>
        </div>

        {heatmapData.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Geen data beschikbaar</div>
        ) : (
          <div className="overflow-x-auto p-6">
            <div className="inline-block min-w-full">
              {/* Day labels */}
              <div className="flex gap-1 mb-2">
                <div className="w-12"></div>
                {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                  <div key={day} className="w-10 text-center text-xs text-gray-600 font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              {heatmapData.map((week, weekIndex) => {
                const mondayDate = new Date(week[0].date + 'T12:00:00');
                const weekNumber = getISOWeekNumber(mondayDate);

                return (
                  <div key={weekIndex} className="flex gap-1 mb-1">
                    <div className="w-12 text-xs text-gray-600 flex items-center">
                      W{weekNumber}
                    </div>
                    {week.map((day, dayIndex) => {
                      const dayDate = new Date(day.date);
                      const dayNum = dayDate.getDate();
                      const colorClass = getColor(selectedMetric, day.activity);

                      // Build tooltip
                      let tooltipText = day.date;
                      if (day.activity) {
                        let value = '';
                        switch (selectedMetric) {
                          case 'steps':
                            value = `${day.activity.steps?.toLocaleString() || 0} stappen`;
                            break;
                          case 'calories':
                            value = `${day.activity.totalCalories || 0} kcal`;
                            break;
                          case 'intensityMinutes':
                            value = `${day.activity.intensityMinutes || 0} min`;
                            break;
                          case 'sleep':
                            const hours = Math.round((day.activity.sleepSeconds || 0) / 3600);
                            value = `${hours}u slaap`;
                            break;
                          case 'bodyBattery':
                            value = `BB ${day.activity.bodyBattery || 0}`;
                            break;
                          case 'stress':
                            value = `Stress ${day.activity.stressLevel || 0}`;
                            break;
                        }
                        tooltipText = `${day.date}: ${value}`;
                      } else {
                        tooltipText = `${day.date}: Geen data`;
                      }

                      return (
                        <div
                          key={dayIndex}
                          className={`w-10 h-10 rounded ${colorClass} flex items-center justify-center text-white text-xs font-medium hover:ring-2 hover:ring-blue-400 cursor-pointer`}
                          title={tooltipText}
                        >
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Legend */}
              <div className="mt-6 flex gap-6 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Gemiddeld</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Onder doel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span>Geen data</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekday Patterns */}
      <div className="border-b border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Patronen per Weekdag</h2>
          <p className="text-sm text-gray-600 mt-1">Gemiddelden gebaseerd op de laatste 60 dagen</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 0].map(dayNum => {
            const weekday = weekdayPatterns[dayNum as keyof typeof weekdayPatterns];
            if (weekday.activities.length === 0) return null;

            const avg = {
              steps: Math.round(weekday.activities.reduce((sum, a) => sum + (a.steps || 0), 0) / weekday.activities.length),
              calories: Math.round(weekday.activities.reduce((sum, a) => sum + (a.totalCalories || 0), 0) / weekday.activities.length),
              intensityMinutes: Math.round(weekday.activities.reduce((sum, a) => sum + (a.intensityMinutes || 0), 0) / weekday.activities.length),
              sleep: (weekday.activities.reduce((sum, a) => sum + (a.sleepSeconds || 0), 0) / weekday.activities.length / 3600).toFixed(1),
            };

            const badges = [];
            if (avg.steps >= 10000) {
              badges.push(
                <span key="steps" className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                  ⭐ 10k+ stappen
                </span>
              );
            }
            if (parseFloat(avg.sleep) >= 7) {
              badges.push(
                <span key="sleep" className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                  😴 Goede slaap
                </span>
              );
            }
            if (avg.intensityMinutes >= 30) {
              badges.push(
                <span key="intensity" className="inline-block px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                  💪 Actieve dag
                </span>
              );
            }

            return (
              <div key={dayNum} className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md p-4 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-gray-800">{weekday.name}</h4>
                  <span className="text-2xl">{weekday.emoji}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stappen:</span>
                    <span className={`font-semibold ${avg.steps >= 10000 ? 'text-green-600' : avg.steps >= 7000 ? 'text-yellow-600' : 'text-gray-700'}`}>
                      {avg.steps.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calorieën:</span>
                    <span className="font-semibold text-orange-600">
                      {avg.calories}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Int. min:</span>
                    <span className={`font-semibold ${avg.intensityMinutes >= 30 ? 'text-green-600' : 'text-gray-700'}`}>
                      {avg.intensityMinutes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slaap:</span>
                    <span className={`font-semibold ${parseFloat(avg.sleep) >= 7 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {avg.sleep}u
                    </span>
                  </div>
                </div>
                {badges.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {badges}
                  </div>
                )}
                <div className="mt-3 text-xs text-gray-500">
                  Gebaseerd op {weekday.activities.length} dag{weekday.activities.length !== 1 ? 'en' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Table - Collapsible */}
      <div>
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900">Recente Activiteit</h3>
            <span className="text-gray-500">
              {showTable ? '▼ Verberg' : '▶ Toon'} ({activities.length} dagen)
            </span>
          </button>
        </div>

        {showTable && (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
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
        )}
      </div>
    </div>
  );
}
