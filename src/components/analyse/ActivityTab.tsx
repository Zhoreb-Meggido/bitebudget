import { useMemo, useState } from 'react';
import { useActivities, useHeartRateSamples } from '@/hooks';
import { HeartRateChart } from './HeartRateChart';

type ActivityMetric = 'heartRate' | 'steps' | 'calories' | 'intensityMinutes' | 'sleep' | 'bodyBattery' | 'stress';

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
  const { samples: hrSamples, isLoading: hrLoading, getSamplesMap } = useHeartRateSamples();
  const [selectedMetric, setSelectedMetric] = useState<ActivityMetric>('heartRate');
  const [showTable, setShowTable] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (activities.length === 0) return null;

    const total = activities.reduce((acc, activity) => ({
      steps: acc.steps + (activity.steps || 0),
      calories: acc.calories + (activity.totalCalories || 0),
      activeCalories: acc.activeCalories + (activity.activeCalories || 0),
      intensityMinutes: acc.intensityMinutes + (activity.intensityMinutes || 0),
      sleepSeconds: acc.sleepSeconds + (activity.sleepSeconds || 0),
      restingHR: acc.restingHR + (activity.heartRateResting || 0),
      maxHR: acc.maxHR + (activity.heartRateMax || 0),
      restingHRCount: acc.restingHRCount + (activity.heartRateResting ? 1 : 0),
      maxHRCount: acc.maxHRCount + (activity.heartRateMax ? 1 : 0),
    }), {
      steps: 0,
      calories: 0,
      activeCalories: 0,
      intensityMinutes: 0,
      sleepSeconds: 0,
      restingHR: 0,
      maxHR: 0,
      restingHRCount: 0,
      maxHRCount: 0,
    });

    return {
      avgSteps: Math.round(total.steps / activities.length),
      avgCalories: Math.round(total.calories / activities.length),
      avgActiveCalories: Math.round(total.activeCalories / activities.length),
      avgIntensityMinutes: Math.round(total.intensityMinutes / activities.length),
      avgSleepHours: (total.sleepSeconds / activities.length / 3600).toFixed(1),
      avgRestingHR: total.restingHRCount > 0 ? Math.round(total.restingHR / total.restingHRCount) : 0,
      avgMaxHR: total.maxHRCount > 0 ? Math.round(total.maxHR / total.maxHRCount) : 0,
      totalDays: activities.length,
      totalHRDays: hrSamples.length,
    };
  }, [activities, hrSamples]);

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
    const weeks: Array<Array<{ date: string; activity?: typeof activities[0]; hrSample?: typeof hrSamples[0] }>> = [];

    // Create data maps for quick lookup
    const dataMap = new Map(activities.map(a => [a.date, a]));
    const hrMap = getSamplesMap();

    // Generate 8 weeks
    for (let weekIndex = 0; weekIndex < 8; weekIndex++) {
      const week: Array<{ date: string; activity?: typeof activities[0]; hrSample?: typeof hrSamples[0] }> = [];

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
          hrSample: hrMap.get(dateStr),
        });
      }

      weeks.push(week);
    }

    return weeks.reverse(); // Oldest week first
  }, [activities, hrSamples, getSamplesMap]);

  // Get color for metric value
  const getColor = (metric: ActivityMetric, activity?: typeof activities[0], hrSample?: typeof hrSamples[0]): string => {
    switch (metric) {
      case 'heartRate': {
        if (!hrSample) return 'bg-gray-200';
        const avgHR = hrSample.avgBpm || 0;
        if (avgHR === 0) return 'bg-gray-200';
        // Color based on average resting heart rate ranges
        if (avgHR <= 60) return 'bg-green-500';  // Excellent (athlete level)
        if (avgHR <= 70) return 'bg-yellow-500'; // Good
        if (avgHR <= 80) return 'bg-orange-400'; // Average
        return 'bg-red-400';                     // Above average
      }
      case 'steps': {
        if (!activity) return 'bg-gray-200';
        const steps = activity.steps || 0;
        if (steps >= 10000) return 'bg-green-500';
        if (steps >= 7000) return 'bg-yellow-500';
        if (steps >= 5000) return 'bg-orange-400';
        if (steps > 0) return 'bg-red-400';
        return 'bg-gray-200';
      }
      case 'calories': {
        if (!activity) return 'bg-gray-200';
        const cal = activity.totalCalories || 0;
        if (cal >= 2500) return 'bg-green-500';
        if (cal >= 2000) return 'bg-yellow-500';
        if (cal >= 1500) return 'bg-orange-400';
        if (cal > 0) return 'bg-red-400';
        return 'bg-gray-200';
      }
      case 'intensityMinutes': {
        if (!activity) return 'bg-gray-200';
        // Intensity minutes can be 0 (valid: no intensive activity that day)
        // Only show gray if the whole activity record is missing
        if (activity.intensityMinutes === undefined || activity.intensityMinutes === null) {
          return 'bg-gray-200';
        }
        const mins = activity.intensityMinutes;
        if (mins >= 30) return 'bg-green-500';
        if (mins >= 15) return 'bg-yellow-500';
        if (mins >= 5) return 'bg-orange-400';
        // 0 or very low is still valid data, just not great
        return 'bg-red-400';
      }
      case 'sleep': {
        if (!activity) return 'bg-gray-200';
        const hours = (activity.sleepSeconds || 0) / 3600;
        if (hours >= 7) return 'bg-green-500';
        if (hours >= 6) return 'bg-yellow-500';
        if (hours >= 5) return 'bg-orange-400';
        if (hours > 0) return 'bg-red-400';
        return 'bg-gray-200';
      }
      case 'bodyBattery': {
        if (!activity) return 'bg-gray-200';
        const bb = activity.bodyBattery || 0;
        if (bb >= 75) return 'bg-green-500';
        if (bb >= 50) return 'bg-yellow-500';
        if (bb >= 25) return 'bg-orange-400';
        if (bb > 0) return 'bg-red-400';
        return 'bg-gray-200';
      }
      case 'stress': {
        if (!activity) return 'bg-gray-200';
        const stress = activity.stressLevel || 0;
        if (stress === 0) return 'bg-gray-200';
        if (stress <= 30) return 'bg-green-500';
        if (stress <= 50) return 'bg-yellow-500';
        if (stress <= 70) return 'bg-orange-400';
        return 'bg-red-400';
      }
      default:
        return 'bg-gray-200';
    }
  };

  const metricLabels: Record<ActivityMetric, string> = {
    heartRate: 'Hartslag',
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 font-medium mb-1">Dagen</div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalDays || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-600 font-medium mb-1">💓 Ø Rust HR</div>
          <div className="text-2xl font-bold text-red-900">{stats?.avgRestingHR || '-'}</div>
          <div className="text-xs text-red-600 mt-1">{stats?.totalHRDays || 0} dagen</div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
          <div className="text-sm text-pink-600 font-medium mb-1">⚡ Ø Max HR</div>
          <div className="text-2xl font-bold text-pink-900">{stats?.avgMaxHR || '-'}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Ø Stappen</div>
          <div className="text-2xl font-bold text-blue-900">{stats?.avgSteps.toLocaleString() || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="text-sm text-orange-600 font-medium mb-1">Ø Cal</div>
          <div className="text-2xl font-bold text-orange-900">{stats?.avgCalories || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Ø Actief</div>
          <div className="text-2xl font-bold text-green-900">{stats?.avgActiveCalories || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-medium mb-1">Ø Int.min</div>
          <div className="text-2xl font-bold text-purple-900">{stats?.avgIntensityMinutes || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
          <div className="text-sm text-indigo-600 font-medium mb-1">Ø Slaap</div>
          <div className="text-2xl font-bold text-indigo-900">{stats?.avgSleepHours || 0}u</div>
        </div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="border-b border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Activiteit Kalender</h2>

          <select
            value={selectedMetric}
            onChange={(e) => {
              setSelectedMetric(e.target.value as ActivityMetric);
              setSelectedDate(null); // Reset selected date when switching metrics
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="heartRate">💓 Hartslag</option>
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
          <div className="p-6 flex flex-col lg:flex-row gap-6">
            {/* Heatmap (left side on desktop, top on mobile) */}
            <div className={`flex-shrink-0 overflow-x-auto ${selectedDate && selectedMetric === 'heartRate' ? 'lg:w-auto' : 'w-full'}`}>
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
                      const colorClass = getColor(selectedMetric, day.activity, day.hrSample);
                      const hasHRData = day.hrSample && day.hrSample.sampleCount > 0;
                      const isClickable = selectedMetric === 'heartRate' && hasHRData;

                      // Build tooltip
                      let tooltipText = day.date;
                      if (selectedMetric === 'heartRate' && day.hrSample) {
                        tooltipText = `${day.date}: ${day.hrSample.avgBpm} bpm avg (${day.hrSample.minBpm}-${day.hrSample.maxBpm})`;
                      } else if (day.activity) {
                        let value = '';
                        switch (selectedMetric) {
                          case 'steps':
                            value = `${day.activity.steps?.toLocaleString() || 0} stappen`;
                            break;
                          case 'calories':
                            value = `${day.activity.totalCalories || 0} kcal`;
                            break;
                          case 'intensityMinutes':
                            const mins = day.activity.intensityMinutes ?? 0;
                            value = `${mins} min`;
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
                          className={`w-10 h-10 rounded ${colorClass} flex items-center justify-center text-white text-xs font-medium hover:ring-2 hover:ring-blue-400 transition-all ${
                            isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                          } ${selectedDate === day.date ? 'ring-4 ring-blue-500' : ''}`}
                          title={tooltipText}
                          onClick={() => {
                            if (isClickable) {
                              setSelectedDate(selectedDate === day.date ? null : day.date);
                            }
                          }}
                        >
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Uitstekend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Goed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span>Matig</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span>Kan beter</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span>Geen data</span>
                </div>
              </div>
            </div>
            </div>

            {/* Heart Rate Chart (right side on desktop, below on mobile) */}
            {selectedDate && selectedMetric === 'heartRate' && (
              <div className="flex-1 min-w-0">
                <HeartRateChart
                  data={getSamplesMap().get(selectedDate)!}
                  onClose={() => setSelectedDate(null)}
                />
              </div>
            )}
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
