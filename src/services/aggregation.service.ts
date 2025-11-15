/**
 * Aggregation Service
 *
 * Provides reusable logic for calculating weekly and monthly aggregates
 * from nutrition and activity data.
 */

import type { Entry, DailyActivity, Settings } from '@/types/database.types';
import type {
  WeekAggregate,
  WeekNutritionAggregate,
  WeekActivityAggregate,
  MonthAggregate,
  AggregatePeriod,
} from '@/types/aggregates.types';

/**
 * Helper: Calculate ISO week number (Monday-based)
 * Extracted from NutritionTab
 */
export function getISOWeekNumber(date: Date): { week: number; year: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday = 0
  target.setDate(target.getDate() - dayNr + 3); // Thursday in current week
  const firstThursday = target.valueOf();
  const year = target.getFullYear();

  target.setMonth(0, 1); // First day of year
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7); // First Thursday of year
  }

  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return { week: weekNumber, year };
}

/**
 * Helper: Get Monday of the week for a given date
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0); // Noon to avoid timezone issues
  return d;
}

/**
 * Helper: Get date range for a period
 */
export function getDateRangeForPeriod(period: AggregatePeriod): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];

  const daysMap: Record<AggregatePeriod, number> = {
    '4weeks': 28,
    '8weeks': 56,
    '12weeks': 84,
    '6months': 180,
    '12months': 365,
  };

  const startDateObj = new Date(today);
  startDateObj.setDate(today.getDate() - daysMap[period]);
  const startDate = startDateObj.toISOString().split('T')[0];

  return { startDate, endDate };
}

/**
 * Aggregate entries by date (daily totals)
 */
export function aggregateEntriesByDate(entries: Entry[]): Map<string, DailyNutrition> {
  const dailyMap = new Map<string, DailyNutrition>();

  entries
    .filter(e => !e.deleted) // Exclude soft-deleted entries
    .forEach(entry => {
      const existing = dailyMap.get(entry.date) || {
        date: entry.date,
        calories: 0,
        protein: 0,
        carbs: 0,
        sugars: 0,
        fat: 0,
        saturatedFat: 0,
        fiber: 0,
        sodium: 0,
      };

      dailyMap.set(entry.date, {
        date: entry.date,
        calories: existing.calories + (entry.calories || 0),
        protein: existing.protein + (entry.protein || 0),
        carbs: existing.carbs + (entry.carbohydrates || 0),
        sugars: existing.sugars + (entry.sugars || 0),
        fat: existing.fat + (entry.fat || 0),
        saturatedFat: existing.saturatedFat + (entry.saturatedFat || 0),
        fiber: existing.fiber + (entry.fiber || 0),
        sodium: existing.sodium + (entry.sodium || 0),
      });
    });

  return dailyMap;
}

interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
}

/**
 * Group daily nutrition data by week
 */
export function groupByWeek(
  dailyNutrition: Map<string, DailyNutrition>,
  startDate: string,
  endDate: string
): Map<string, DailyNutrition[]> {
  const weeks = new Map<string, DailyNutrition[]>();

  for (const [date, nutrition] of dailyNutrition.entries()) {
    if (date >= startDate && date <= endDate) {
      const dateObj = new Date(date + 'T12:00:00');
      const monday = getMondayOfWeek(dateObj);
      const weekKey = monday.toISOString().split('T')[0];

      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, []);
      }
      weeks.get(weekKey)!.push(nutrition);
    }
  }

  return weeks;
}

/**
 * Calculate weekly nutrition aggregate from daily data
 */
export function calculateWeekNutritionAggregate(
  days: DailyNutrition[],
  settings: Settings
): WeekNutritionAggregate {
  if (days.length === 0) {
    return {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgSugars: 0,
      avgFat: 0,
      avgSaturatedFat: 0,
      avgFiber: 0,
      avgSodium: 0,
      daysUnderCalorieTarget: 0,
      daysOverCalorieTarget: 0,
      daysInRange: 0,
    };
  }

  const sum = days.reduce((acc, day) => ({
    calories: acc.calories + day.calories,
    protein: acc.protein + day.protein,
    carbs: acc.carbs + day.carbs,
    sugars: acc.sugars + day.sugars,
    fat: acc.fat + day.fat,
    saturatedFat: acc.saturatedFat + day.saturatedFat,
    fiber: acc.fiber + day.fiber,
    sodium: acc.sodium + day.sodium,
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    sugars: 0,
    fat: 0,
    saturatedFat: 0,
    fiber: 0,
    sodium: 0,
  });

  const count = days.length;
  const lowerBound = settings.calories * 0.9; // -10%
  const upperBound = settings.calories * 1.1; // +10%

  return {
    avgCalories: Math.round(sum.calories / count),
    avgProtein: Math.round(sum.protein / count),
    avgCarbs: Math.round(sum.carbs / count),
    avgSugars: Math.round(sum.sugars / count),
    avgFat: Math.round(sum.fat / count),
    avgSaturatedFat: Math.round(sum.saturatedFat / count),
    avgFiber: Math.round(sum.fiber / count),
    avgSodium: Math.round(sum.sodium / count),
    daysUnderCalorieTarget: days.filter(d => d.calories < lowerBound).length,
    daysOverCalorieTarget: days.filter(d => d.calories > upperBound).length,
    daysInRange: days.filter(d => d.calories >= lowerBound && d.calories <= upperBound).length,
  };
}

/**
 * Calculate weekly aggregates from entries
 */
export function calculateWeeklyAggregates(
  entries: Entry[],
  activities: DailyActivity[],
  settings: Settings,
  startDate: string,
  endDate: string
): WeekAggregate[] {
  // Step 1: Aggregate entries by date
  const dailyNutrition = aggregateEntriesByDate(entries);

  // Step 2: Group by week
  const weeklyData = groupByWeek(dailyNutrition, startDate, endDate);

  // Step 3: Create activity map for quick lookup
  const activityMap = new Map(
    activities.filter(a => !a.deleted).map(a => [a.date, a])
  );

  // Step 4: Calculate aggregates per week
  const aggregates: WeekAggregate[] = Array.from(weeklyData.entries())
    .map(([weekStart, days]) => {
      const weekStartDate = new Date(weekStart + 'T12:00:00');
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      const weekEnd = weekEndDate.toISOString().split('T')[0];

      const { week: weekNumber, year } = getISOWeekNumber(weekStartDate);

      // Calculate nutrition aggregate
      const nutrition = calculateWeekNutritionAggregate(days, settings);

      // Calculate activity aggregate (if activity data exists)
      const activitiesInWeek = days
        .map(d => activityMap.get(d.date))
        .filter((a): a is DailyActivity => a !== undefined);

      const activity = calculateWeekActivityAggregate(activitiesInWeek);

      return {
        weekNumber,
        year,
        weekStart,
        weekEnd,
        daysTracked: days.length,
        nutrition,
        activity: activitiesInWeek.length > 0 ? activity : undefined,
      };
    })
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart)); // Most recent first

  return aggregates;
}

/**
 * Calculate weekly activity aggregate
 */
function calculateWeekActivityAggregate(activities: DailyActivity[]): WeekActivityAggregate {
  if (activities.length === 0) {
    return {
      avgSteps: 0,
      avgActiveCalories: 0,
      avgRestingCalories: 0,
      avgTotalCalories: 0,
      avgIntensityMinutes: 0,
      avgDistanceMeters: 0,
      avgFloorsClimbed: 0,
      avgSleepSeconds: 0,
      avgHeartRateResting: 0,
      avgHeartRateMax: 0,
      daysWithActivity: 0,
    };
  }

  const sum = activities.reduce((acc, activity) => ({
    steps: acc.steps + (activity.steps || 0),
    activeCalories: acc.activeCalories + (activity.activeCalories || 0),
    restingCalories: acc.restingCalories + (activity.restingCalories || 0),
    totalCalories: acc.totalCalories + (activity.totalCalories || 0),
    intensityMinutes: acc.intensityMinutes + (activity.intensityMinutes || 0),
    distanceMeters: acc.distanceMeters + (activity.distanceMeters || 0),
    floorsClimbed: acc.floorsClimbed + (activity.floorsClimbed || 0),
    sleepSeconds: acc.sleepSeconds + (activity.sleepSeconds || 0),
    heartRateResting: acc.heartRateResting + (activity.heartRateResting || 0),
    heartRateMax: acc.heartRateMax + (activity.heartRateMax || 0),
  }), {
    steps: 0,
    activeCalories: 0,
    restingCalories: 0,
    totalCalories: 0,
    intensityMinutes: 0,
    distanceMeters: 0,
    floorsClimbed: 0,
    sleepSeconds: 0,
    heartRateResting: 0,
    heartRateMax: 0,
  });

  const count = activities.length;

  return {
    avgSteps: Math.round(sum.steps / count),
    avgActiveCalories: Math.round(sum.activeCalories / count),
    avgRestingCalories: Math.round(sum.restingCalories / count),
    avgTotalCalories: Math.round(sum.totalCalories / count),
    avgIntensityMinutes: Math.round(sum.intensityMinutes / count),
    avgDistanceMeters: Math.round(sum.distanceMeters / count),
    avgFloorsClimbed: Math.round(sum.floorsClimbed / count),
    avgSleepSeconds: Math.round(sum.sleepSeconds / count),
    avgHeartRateResting: Math.round(sum.heartRateResting / count),
    avgHeartRateMax: Math.round(sum.heartRateMax / count),
    daysWithActivity: count,
  };
}

/**
 * Calculate monthly aggregates (groups weeks by month)
 */
export function calculateMonthlyAggregates(
  entries: Entry[],
  activities: DailyActivity[],
  settings: Settings,
  startDate: string,
  endDate: string
): MonthAggregate[] {
  // Step 1: Get weekly aggregates for the entire period
  const weeklyAggregates = calculateWeeklyAggregates(entries, activities, settings, startDate, endDate);

  if (weeklyAggregates.length === 0) {
    return [];
  }

  // Step 2: Group weeks by month
  const monthsMap = new Map<string, WeekAggregate[]>();

  weeklyAggregates.forEach(week => {
    // Use the week start date to determine the month
    const weekStartDate = new Date(week.weekStart + 'T12:00:00');
    const monthKey = `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, []);
    }
    monthsMap.get(monthKey)!.push(week);
  });

  // Step 3: Calculate aggregates per month
  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  const monthlyAggregates: MonthAggregate[] = Array.from(monthsMap.entries())
    .map(([monthKey, weeks]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      // Get month boundaries
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0); // Last day of month

      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = monthEnd.toISOString().split('T')[0];

      // Aggregate daily nutrition data for the month
      const dailyNutrition = aggregateEntriesByDate(entries);
      const daysInMonth: DailyNutrition[] = [];

      for (const [date, nutrition] of dailyNutrition.entries()) {
        if (date >= monthStartStr && date <= monthEndStr) {
          daysInMonth.push(nutrition);
        }
      }

      // Calculate monthly nutrition aggregate
      const nutrition = calculateMonthNutritionAggregate(daysInMonth, weeks, settings);

      // Calculate monthly activity aggregate (if activity data exists)
      const activitiesInMonth = activities.filter(
        a => !a.deleted && a.date >= monthStartStr && a.date <= monthEndStr
      );
      const activity = activitiesInMonth.length > 0
        ? calculateMonthActivityAggregate(activitiesInMonth)
        : undefined;

      return {
        month,
        year,
        monthName: monthNames[month - 1],
        monthStart: monthStartStr,
        monthEnd: monthEndStr,
        weeksInMonth: weeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
        daysTracked: daysInMonth.length,
        nutrition,
        activity,
      };
    })
    .sort((a, b) => {
      // Sort by year, then month (most recent first)
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

  return monthlyAggregates;
}

/**
 * Calculate monthly nutrition aggregate
 */
function calculateMonthNutritionAggregate(
  days: DailyNutrition[],
  weeks: WeekAggregate[],
  settings: Settings
): MonthNutritionAggregate {
  if (days.length === 0) {
    return {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgSugars: 0,
      avgFat: 0,
      avgSaturatedFat: 0,
      avgFiber: 0,
      avgSodium: 0,
      bestWeek: 0,
      worstWeek: 0,
      totalDaysTracked: 0,
    };
  }

  const sum = days.reduce((acc, day) => ({
    calories: acc.calories + day.calories,
    protein: acc.protein + day.protein,
    carbs: acc.carbs + day.carbs,
    sugars: acc.sugars + day.sugars,
    fat: acc.fat + day.fat,
    saturatedFat: acc.saturatedFat + day.saturatedFat,
    fiber: acc.fiber + day.fiber,
    sodium: acc.sodium + day.sodium,
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    sugars: 0,
    fat: 0,
    saturatedFat: 0,
    fiber: 0,
    sodium: 0,
  });

  const count = days.length;

  // Find best/worst week based on calorie adherence
  let bestWeek = weeks[0];
  let worstWeek = weeks[0];

  weeks.forEach(week => {
    const weekAdherence = week.nutrition.daysInRange / week.daysTracked;
    const bestAdherence = bestWeek.nutrition.daysInRange / bestWeek.daysTracked;
    const worstAdherence = worstWeek.nutrition.daysInRange / worstWeek.daysTracked;

    if (weekAdherence > bestAdherence) {
      bestWeek = week;
    }
    if (weekAdherence < worstAdherence) {
      worstWeek = week;
    }
  });

  return {
    avgCalories: Math.round(sum.calories / count),
    avgProtein: Math.round(sum.protein / count),
    avgCarbs: Math.round(sum.carbs / count),
    avgSugars: Math.round(sum.sugars / count),
    avgFat: Math.round(sum.fat / count),
    avgSaturatedFat: Math.round(sum.saturatedFat / count),
    avgFiber: Math.round(sum.fiber / count),
    avgSodium: Math.round(sum.sodium / count),
    bestWeek: bestWeek.weekNumber,
    worstWeek: worstWeek.weekNumber,
    totalDaysTracked: count,
  };
}

/**
 * Calculate monthly activity aggregate
 */
function calculateMonthActivityAggregate(activities: DailyActivity[]): MonthActivityAggregate {
  if (activities.length === 0) {
    return {
      avgSteps: 0,
      avgActiveCalories: 0,
      avgSleepSeconds: 0,
      avgIntensityMinutes: 0,
      totalDaysWithActivity: 0,
    };
  }

  const sum = activities.reduce((acc, activity) => ({
    steps: acc.steps + (activity.steps || 0),
    activeCalories: acc.activeCalories + (activity.activeCalories || 0),
    sleepSeconds: acc.sleepSeconds + (activity.sleepSeconds || 0),
    intensityMinutes: acc.intensityMinutes + (activity.intensityMinutes || 0),
  }), {
    steps: 0,
    activeCalories: 0,
    sleepSeconds: 0,
    intensityMinutes: 0,
  });

  const count = activities.length;

  return {
    avgSteps: Math.round(sum.steps / count),
    avgActiveCalories: Math.round(sum.activeCalories / count),
    avgSleepSeconds: Math.round(sum.sleepSeconds / count),
    avgIntensityMinutes: Math.round(sum.intensityMinutes / count),
    totalDaysWithActivity: count,
  };
}

class AggregationService {
  calculateWeeklyAggregates = calculateWeeklyAggregates;
  calculateMonthlyAggregates = calculateMonthlyAggregates;
  getISOWeekNumber = getISOWeekNumber;
  getDateRangeForPeriod = getDateRangeForPeriod;
}

export const aggregationService = new AggregationService();
