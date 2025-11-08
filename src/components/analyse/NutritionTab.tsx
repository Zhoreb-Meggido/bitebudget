import { useState, useMemo } from 'react';
import { useEntries } from '@/hooks';

type MetricType = 'calories' | 'protein' | 'carbohydrates' | 'sugars' | 'saturatedFat' | 'fiber' | 'sodium' | 'overall';

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
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('overall');

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

  // ... (rest of the content from AnalysePage will go here)
  // For now, let's just show a placeholder

  return (
    <div>
      <p className="text-gray-600">Week vergelijking en kalender overzicht</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">Voedingsanalyses worden hier weergegeven</p>
        <p className="text-xs text-gray-500 mt-2">{dailyData.length} dagen data beschikbaar</p>
      </div>
    </div>
  );
}
