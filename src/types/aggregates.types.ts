/**
 * Types for Weekly and Monthly Aggregate Views
 */

export interface WeekAggregate {
  weekNumber: number;
  year: number;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  daysTracked: number; // Number of days with entries
  nutrition: WeekNutritionAggregate;
  activity?: WeekActivityAggregate;
}

export interface WeekNutritionAggregate {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgSugars: number;
  avgFat: number;
  avgSaturatedFat: number;
  avgFiber: number;
  avgSodium: number;
  daysUnderCalorieTarget: number;
  daysOverCalorieTarget: number;
  daysInRange: number; // Within +/- 10% of target
}

export interface WeekActivityAggregate {
  avgSteps: number;
  avgActiveCalories: number;
  avgRestingCalories: number;
  avgTotalCalories: number;
  avgIntensityMinutes: number;
  avgDistanceMeters: number;
  avgFloorsClimbed: number;
  avgSleepSeconds: number;
  avgHeartRateResting: number;
  avgHeartRateMax: number;
  daysWithActivity: number;
}

export interface MonthAggregate {
  month: number; // 1-12
  year: number;
  monthName: string; // "January", "February", etc.
  monthStart: string; // YYYY-MM-DD
  monthEnd: string; // YYYY-MM-DD
  weeksInMonth: WeekAggregate[];
  daysTracked: number;
  nutrition: MonthNutritionAggregate;
  activity?: MonthActivityAggregate;
}

export interface MonthNutritionAggregate {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgSugars: number;
  avgFat: number;
  avgSaturatedFat: number;
  avgFiber: number;
  avgSodium: number;
  bestWeek: number; // Week number with best calorie adherence
  worstWeek: number; // Week number with worst calorie adherence
  totalDaysTracked: number;
}

export interface MonthActivityAggregate {
  avgSteps: number;
  avgActiveCalories: number;
  avgSleepSeconds: number;
  avgIntensityMinutes: number;
  totalDaysWithActivity: number;
}

export type AggregatePeriod =
  | '4weeks'
  | '8weeks'
  | '12weeks'
  | '6months'
  | '12months';

export interface AggregateOptions {
  period: AggregatePeriod;
  includeActivity: boolean;
  startDate?: string; // Optional custom start date
  endDate?: string; // Optional custom end date
}
