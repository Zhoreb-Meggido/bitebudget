import { useState, useMemo } from 'react';
import { useEntries, useSettings, useWeights } from '@/hooks';
import { NUTRITION_CONSTANTS } from '@/config/nutrition.constants';

type MetricType = 'calories' | 'protein' | 'carbohydrates' | 'sugars' | 'fat' | 'saturatedFat' | 'fiber' | 'sodium' | 'overall';

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
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000); // 604800000 = 7 * 24 * 3600 * 1000
}

interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
}

interface WeekData {
  weekStart: string;
  weekEnd: string;
  days: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbohydrates: number;
  avgSugars: number;
  avgSaturatedFat: number;
  avgFiber: number;
  avgSodium: number;
  daysUnderCalories: number;
}

export function NutritionTab() {
  const { entries } = useEntries();
  const { settings } = useSettings();
  const { weights } = useWeights();
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('overall');

  // Get most recent weight for protein calculation
  const currentWeight = useMemo(() => {
    const validWeights = weights.filter(w => !w.deleted && w.weight > 0);
    if (validWeights.length === 0) return settings.targetWeight;

    // Sort by date descending and get the most recent
    const sorted = [...validWeights].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0].weight;
  }, [weights, settings.targetWeight]);

  // Aggregate entries per day
  const dailyData = useMemo(() => {
    const days: Map<string, DayData> = new Map();

    entries.forEach(entry => {
      const existing = days.get(entry.date) || {
        date: entry.date,
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        sugars: 0,
        fat: 0,
        saturatedFat: 0,
        fiber: 0,
        sodium: 0,
      };

      days.set(entry.date, {
        date: entry.date,
        calories: existing.calories + (entry.calories || 0),
        protein: existing.protein + (entry.protein || 0),
        carbohydrates: existing.carbohydrates + (entry.carbohydrates || 0),
        sugars: existing.sugars + (entry.sugars || 0),
        fat: existing.fat + (entry.fat || 0),
        saturatedFat: existing.saturatedFat + (entry.saturatedFat || 0),
        fiber: existing.fiber + (entry.fiber || 0),
        sodium: existing.sodium + (entry.sodium || 0),
      });
    });

    return Array.from(days.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  // Calculate week comparison data (last 8 weeks)
  const weekData = useMemo(() => {
    const weeks: Map<string, DayData[]> = new Map();

    // Get date 60 days ago
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const cutoffDate = sixtyDaysAgo.toISOString().split('T')[0];

    // Filter and group by week (Monday as start)
    dailyData
      .filter(d => d.date >= cutoffDate)
      .forEach(day => {
        const date = new Date(day.date + 'T12:00:00'); // Use noon to avoid timezone issues
        const dayOfWeek = date.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start
        const monday = new Date(date);
        monday.setDate(date.getDate() + diff);
        const weekKey = monday.toISOString().split('T')[0];

        if (!weeks.has(weekKey)) {
          weeks.set(weekKey, []);
        }
        weeks.get(weekKey)!.push(day);
      });

    // Calculate weekly averages
    const weekStats: WeekData[] = Array.from(weeks.entries())
      .map(([weekStart, days]) => {
        const sunday = new Date(weekStart + 'T12:00:00');
        sunday.setDate(sunday.getDate() + 6);
        const weekEnd = sunday.toISOString().split('T')[0];

        const sum = days.reduce((acc, day) => ({
          calories: acc.calories + day.calories,
          protein: acc.protein + day.protein,
          carbohydrates: acc.carbohydrates + day.carbohydrates,
          sugars: acc.sugars + day.sugars,
          saturatedFat: acc.saturatedFat + day.saturatedFat,
          fiber: acc.fiber + day.fiber,
          sodium: acc.sodium + day.sodium,
        }), { calories: 0, protein: 0, carbohydrates: 0, sugars: 0, saturatedFat: 0, fiber: 0, sodium: 0 });

        const daysUnderCalories = days.filter(d => d.calories < settings.calories).length;

        return {
          weekStart,
          weekEnd,
          days: days.length,
          avgCalories: Math.round(sum.calories / days.length),
          avgProtein: Math.round(sum.protein / days.length),
          avgCarbohydrates: Math.round(sum.carbohydrates / days.length),
          avgSugars: Math.round(sum.sugars / days.length),
          avgSaturatedFat: Math.round(sum.saturatedFat / days.length),
          avgFiber: Math.round(sum.fiber / days.length),
          avgSodium: Math.round(sum.sodium / days.length),
          daysUnderCalories,
        };
      })
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      .slice(0, 8);

    return weekStats;
  }, [dailyData]);

  // Get color for metric value
  const getColor = (metric: MetricType, value: number | undefined, dayData?: DayData): string => {
    if (value === undefined || !dayData) return 'bg-gray-200';

    switch (metric) {
      case 'calories':
        if (value < settings.calories) return 'bg-green-500';
        if (value < NUTRITION_CONSTANTS.CALORIE_YELLOW_THRESHOLD) return 'bg-yellow-500';
        return 'bg-red-500';

      case 'protein': {
        // Calculate protein target based on current weight (Voedingscentrum recommendation)
        const proteinTarget = NUTRITION_CONSTANTS.PROTEIN_PER_KG_MIN * currentWeight;
        const minThreshold = proteinTarget * NUTRITION_CONSTANTS.PROTEIN_MIN_THRESHOLD;
        const maxThreshold = proteinTarget * NUTRITION_CONSTANTS.PROTEIN_MAX_THRESHOLD;

        if (value < minThreshold) return 'bg-red-500';      // Below 80%
        if (value <= maxThreshold) return 'bg-yellow-500';  // 80-120%
        return 'bg-green-500';                               // Above 120%
      }

      case 'carbohydrates':
        // Treat 0 as "no data" since tracking 0g carbs is virtually impossible
        if (value === 0) return 'bg-gray-200';
        if (value < settings.carbohydratesMax * 0.8) return 'bg-green-500';
        if (value <= settings.carbohydratesMax) return 'bg-yellow-500';
        return 'bg-red-500';

      case 'sugars':
        // Treat 0 as "no data" since tracking 0g sugars is virtually impossible
        if (value === 0) return 'bg-gray-200';
        if (value < settings.sugarsMax * 0.8) return 'bg-green-500';
        if (value <= settings.sugarsMax) return 'bg-yellow-500';
        return 'bg-red-500';

      case 'fat':
        // Treat 0 as "no data" since tracking 0g fat is virtually impossible
        if (value === 0) return 'bg-gray-200';
        if (value < settings.fatMax * 0.8) return 'bg-green-500';
        if (value <= settings.fatMax) return 'bg-yellow-500';
        return 'bg-red-500';

      case 'saturatedFat':
        if (value < settings.saturatedFatMax) return 'bg-green-500';
        if (value < settings.saturatedFatMax * 1.25) return 'bg-yellow-500';
        return 'bg-red-500';

      case 'fiber':
        // Green: sufficient intake, Yellow: minimum acceptable, Red: below minimum
        if (value >= NUTRITION_CONSTANTS.FIBER_SUFFICIENT) return 'bg-green-500';
        if (value >= NUTRITION_CONSTANTS.FIBER_MINIMUM) return 'bg-yellow-500';
        return 'bg-red-500';

      case 'sodium':
        if (value < settings.sodiumMax) return 'bg-green-500';
        if (value < settings.sodiumMax * 1.2) return 'bg-yellow-500';
        return 'bg-red-500';

      case 'overall': {
        // Calculate percentage of targets met
        // Only count metrics that have actual data (non-zero values)
        let score = 0;
        let totalMetrics = 0;

        // Always count calories and protein (core metrics)
        totalMetrics += 2;
        if (dayData.calories < settings.calories) score++;

        // Protein: check if at least 80% of target (Voedingscentrum recommendation)
        const proteinTarget = NUTRITION_CONSTANTS.PROTEIN_PER_KG_MIN * currentWeight;
        const proteinMin = proteinTarget * NUTRITION_CONSTANTS.PROTEIN_MIN_THRESHOLD;
        if (dayData.protein >= proteinMin) score++;

        // Only count carbs/sugars/fat if tracked (non-zero)
        if (dayData.carbohydrates > 0) {
          totalMetrics++;
          if (dayData.carbohydrates <= settings.carbohydratesMax) score++;
        }
        if (dayData.sugars > 0) {
          totalMetrics++;
          if (dayData.sugars <= settings.sugarsMax) score++;
        }
        if (dayData.fat > 0) {
          totalMetrics++;
          if (dayData.fat <= settings.fatMax) score++;
        }

        // Always count saturated fat, fiber, sodium (typically tracked)
        totalMetrics += 3;
        if (dayData.saturatedFat < settings.saturatedFatMax) score++;
        if (dayData.fiber >= NUTRITION_CONSTANTS.FIBER_SUFFICIENT) score++;  // Sufficient intake (not personal goal which may be higher)
        if (dayData.sodium < settings.sodiumMax) score++;

        const percentage = totalMetrics > 0 ? (score / totalMetrics) * 100 : 0;
        if (percentage >= 75) return 'bg-green-500';  // 6/8 or better
        if (percentage >= 50) return 'bg-yellow-500'; // 4/8 or 5/8
        return 'bg-red-500';                           // 3/8 or worse
      }

      default:
        return 'bg-gray-200';
    }
  };

  // Generate heatmap data (8 weeks)
  const heatmapData = useMemo(() => {
    // Use UTC to avoid timezone issues
    const today = new Date();
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const weeks: Array<Array<{ date: string; data?: DayData }>> = [];

    // Create data map for quick lookup
    const dataMap = new Map(dailyData.map(d => [d.date, d]));

    // Generate 8 weeks
    for (let weekIndex = 0; weekIndex < 8; weekIndex++) {
      const week: Array<{ date: string; data?: DayData }> = [];

      // Calculate Monday of this week (going backwards) in UTC
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
          data: dataMap.get(dateStr),
        });
      }

      weeks.push(week);
    }

    return weeks.reverse(); // Oldest week first
  }, [dailyData]);

  // Weekday trends data
  const weekdayTrends = useMemo(() => {
    const weekdays = {
      1: { name: 'Maandag', days: [] as DayData[], emoji: '📅' },
      2: { name: 'Dinsdag', days: [] as DayData[], emoji: '📅' },
      3: { name: 'Woensdag', days: [] as DayData[], emoji: '🍺' },
      4: { name: 'Donderdag', days: [] as DayData[], emoji: '🍕' },
      5: { name: 'Vrijdag', days: [] as DayData[], emoji: '📅' },
      6: { name: 'Zaterdag', days: [] as DayData[], emoji: '🏖️' },
      0: { name: 'Zondag', days: [] as DayData[], emoji: '😴' }
    };

    // Get last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const cutoffDate = sixtyDaysAgo.toISOString().split('T')[0];

    dailyData
      .filter(d => d.date >= cutoffDate)
      .forEach(day => {
        const date = new Date(day.date + 'T12:00:00');
        const dayOfWeek = date.getDay();
        weekdays[dayOfWeek as keyof typeof weekdays].days.push(day);
      });

    return weekdays;
  }, [dailyData]);

  const metricLabels: Record<MetricType, string> = {
    calories: 'Calorieën',
    protein: 'Eiwit',
    carbohydrates: 'Koolhydraten',
    sugars: 'Suikers',
    fat: 'Vet',
    saturatedFat: 'Verzadigd Vet',
    fiber: 'Vezels',
    sodium: 'Natrium',
    overall: 'Overall Score',
  };

  return (
    <div>
      {/* Week Comparison */}
      <div className="border-b border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Week Vergelijking</h2>
        </div>

        {weekData.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Geen data beschikbaar voor week vergelijking
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ø Kcal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ø Eiwit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ø Koolh.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ø Suikers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ø V.vet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ø Vezels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ø Natrium
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dagen &lt;1900
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weekData.map((week) => {
                  const startDate = new Date(week.weekStart);
                  const endDate = new Date(week.weekEnd);

                  return (
                    <tr key={week.weekStart} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {startDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                        {' - '}
                        {endDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {week.days}/7
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${week.avgCalories < 1900 ? 'text-green-600' : 'text-gray-900'}`}>
                        {week.avgCalories}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        week.avgProtein >= 72 ? 'text-green-600' : week.avgProtein >= 36 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {week.avgProtein}g
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {week.avgCarbohydrates}g
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {week.avgSugars}g
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${week.avgSaturatedFat < 20 ? 'text-green-600' : 'text-gray-900'}`}>
                        {week.avgSaturatedFat}g
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        week.avgFiber >= 35 ? 'text-green-600' : week.avgFiber >= 17.5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {week.avgFiber}g
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${week.avgSodium < 2300 ? 'text-green-600' : 'text-gray-900'}`}>
                        {week.avgSodium}mg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {week.daysUnderCalories}/{week.days}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calendar Heatmap */}
      <div className="border-b border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Kalender Overzicht</h2>

          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="overall">Alles (gemiddelde)</option>
            <option value="calories">Calorieën</option>
            <option value="protein">Eiwit</option>
            <option value="carbohydrates">Koolhydraten</option>
            <option value="sugars">Suikers</option>
            <option value="fat">Vet</option>
            <option value="saturatedFat">Verzadigd Vet</option>
            <option value="fiber">Vezels</option>
            <option value="sodium">Natrium</option>
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
                  // Calculate ISO week number for Monday of this week
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

                      // For 'overall', calculate the actual score instead of just using calories
                      let value: number | undefined;
                      if (selectedMetric === 'overall') {
                        // Use any value to trigger color calculation, the getColor function will calculate the actual score
                        value = day.data ? 1 : undefined;
                      } else {
                        value = day.data ? day.data[selectedMetric] : undefined;
                      }
                      const colorClass = getColor(selectedMetric, value, day.data);

                      // Build tooltip with actual value
                      let tooltipText = day.date;
                      if (day.data) {
                        if (selectedMetric === 'overall') {
                          // For overall, show a summary (matching the getColor logic)
                          let score = 0;
                          let totalMetrics = 0;

                          // Always count calories and protein
                          totalMetrics += 2;
                          if (day.data.calories < settings.calories) score++;

                          // Protein: check if at least 80% of target
                          const proteinTarget = NUTRITION_CONSTANTS.PROTEIN_PER_KG_MIN * currentWeight;
                          const proteinMin = proteinTarget * NUTRITION_CONSTANTS.PROTEIN_MIN_THRESHOLD;
                          if (day.data.protein >= proteinMin) score++;

                          // Only count carbs/sugars/fat if tracked (non-zero)
                          if (day.data.carbohydrates > 0) {
                            totalMetrics++;
                            if (day.data.carbohydrates <= settings.carbohydratesMax) score++;
                          }
                          if (day.data.sugars > 0) {
                            totalMetrics++;
                            if (day.data.sugars <= settings.sugarsMax) score++;
                          }
                          if (day.data.fat > 0) {
                            totalMetrics++;
                            if (day.data.fat <= settings.fatMax) score++;
                          }

                          // Always count saturated fat, fiber, sodium
                          totalMetrics += 3;
                          if (day.data.saturatedFat < settings.saturatedFatMax) score++;
                          if (day.data.fiber >= NUTRITION_CONSTANTS.FIBER_SUFFICIENT) score++;  // Sufficient intake
                          if (day.data.sodium < settings.sodiumMax) score++;

                          tooltipText = `${day.date}: ${score}/${totalMetrics} doelen behaald`;
                        } else {
                          // For specific metrics, show the value
                          const val = day.data[selectedMetric];
                          const unit = selectedMetric === 'calories' ? ' kcal' :
                                       selectedMetric === 'sodium' ? ' mg' : ' g';
                          tooltipText = `${day.date}: ${metricLabels[selectedMetric]} ${val}${unit}`;
                        }
                      } else {
                        tooltipText = `${day.date}: Geen data`;
                      }

                      return (
                        <div
                          key={dayIndex}
                          className={`w-10 h-10 rounded ${colorClass} flex items-center justify-center text-white text-xs font-medium hover:ring-2 hover:ring-purple-400 cursor-pointer`}
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
                    <span>Doel behaald</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Gedeeltelijk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Onder/boven doel</span>
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

      {/* Weekday Trends */}
      <div>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Trends per Weekdag</h2>
          <p className="text-sm text-gray-600 mt-1">Gemiddelden gebaseerd op de laatste 60 dagen</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 0].map(dayNum => {
              const weekday = weekdayTrends[dayNum as keyof typeof weekdayTrends];
              if (weekday.days.length === 0) return null;

              const avg = {
                calories: Math.round(weekday.days.reduce((sum, d) => sum + d.calories, 0) / weekday.days.length),
                protein: (weekday.days.reduce((sum, d) => sum + d.protein, 0) / weekday.days.length).toFixed(1),
                carbohydrates: (weekday.days.reduce((sum, d) => sum + d.carbohydrates, 0) / weekday.days.length).toFixed(1),
                sugars: (weekday.days.reduce((sum, d) => sum + d.sugars, 0) / weekday.days.length).toFixed(1),
                saturatedFat: (weekday.days.reduce((sum, d) => sum + d.saturatedFat, 0) / weekday.days.length).toFixed(1),
                fiber: (weekday.days.reduce((sum, d) => sum + d.fiber, 0) / weekday.days.length).toFixed(1),
                sodium: Math.round(weekday.days.reduce((sum, d) => sum + d.sodium, 0) / weekday.days.length)
              };

              const percentAboveCalories = (weekday.days.filter(d => d.calories > 1900).length / weekday.days.length) * 100;
              const percentAboveSodium = (weekday.days.filter(d => d.sodium > 2300).length / weekday.days.length) * 100;

              const badges = [];
              if (percentAboveCalories > 75) {
                badges.push(
                  <span key="cal" className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                    ⚠️ Vaak boven calorie-target
                  </span>
                );
              } else if (avg.calories < 1900 && parseFloat(avg.protein) >= 72) {
                badges.push(
                  <span key="exc" className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    ⭐ Excellente dag!
                  </span>
                );
              }

              if (percentAboveSodium > 75) {
                badges.push(
                  <span key="sod" className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">
                    🧂 Vaak veel zout
                  </span>
                );
              }

              const getProteinColor = (val: string) => {
                const v = parseFloat(val);
                if (v < 36) return 'text-red-600';
                if (v < 72) return 'text-yellow-600';
                return 'text-green-600';
              };

              const getFiberColor = (val: string) => {
                const v = parseFloat(val);
                if (v < 17.5) return 'text-red-600';
                if (v < 35) return 'text-yellow-600';
                return 'text-green-600';
              };

              return (
                <div key={dayNum} className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md p-4 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-gray-800">{weekday.name}</h4>
                    <span className="text-2xl">{weekday.emoji}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Calorieën:</span>
                      <span className={`font-semibold ${avg.calories < 1900 ? 'text-green-600' : 'text-red-600'}`}>
                        {avg.calories} kcal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Eiwit:</span>
                      <span className={`font-semibold ${getProteinColor(avg.protein)}`}>
                        {avg.protein}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Koolhydr.:</span>
                      <span className="font-semibold text-gray-700">
                        {avg.carbohydrates}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Suikers:</span>
                      <span className="font-semibold text-gray-700">
                        {avg.sugars}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verz. vet:</span>
                      <span className={`font-semibold ${avg.saturatedFat < 20 ? 'text-green-600' : 'text-red-600'}`}>
                        {avg.saturatedFat}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vezels:</span>
                      <span className={`font-semibold ${getFiberColor(avg.fiber)}`}>
                        {avg.fiber}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Natrium:</span>
                      <span className={`font-semibold ${avg.sodium < 2300 ? 'text-green-600' : 'text-red-600'}`}>
                        {avg.sodium}mg
                      </span>
                    </div>
                  </div>
                  {badges.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {badges}
                    </div>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    Gebaseerd op {weekday.days.length} dag{weekday.days.length !== 1 ? 'en' : ''}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
