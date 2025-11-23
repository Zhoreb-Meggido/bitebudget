/**
 * Fluid Intake Utilities
 *
 * Utilities voor het berekenen van totale vocht-inname
 * Combineert water entries en calorie-rijke dranken (mealType='drink')
 */

import { waterEntriesService } from '@/services/water-entries.service';
import { db } from '@/services/database.service';
import type { Entry, WaterEntry } from '@/types';

/**
 * Bereken totale vocht-inname voor een specifieke datum
 * Combineert:
 * - Water entries (ml)
 * - Calorie-rijke dranken uit journal entries (1 gram ≈ 1 ml)
 */
export async function getTotalFluidIntake(date: string): Promise<{
  waterMl: number;
  drinksMl: number;
  totalMl: number;
}> {
  // Haal water entries op voor deze datum
  const waterEntries = await waterEntriesService.getEntriesByDate(date);
  const waterMl = waterEntries.reduce((total, entry) => total + entry.amount, 0);

  // Haal journal entries op voor deze datum met mealType='drink'
  const entries = await db.entries
    .where('date')
    .equals(date)
    .filter(e => !e.deleted && e.mealType === 'drink')
    .toArray();

  // Bereken totale hoeveelheid dranken (1 gram ≈ 1 ml)
  const drinksMl = entries.reduce((total, entry) => {
    const totalGrams = entry.products?.reduce((sum, product) => sum + product.grams, 0) || 0;
    return total + totalGrams;
  }, 0);

  return {
    waterMl,
    drinksMl,
    totalMl: waterMl + drinksMl,
  };
}

/**
 * Bereken totale vocht-inname voor een datum range
 * Retourneert per datum de breakdown
 */
export async function getTotalFluidIntakeByDateRange(
  startDate: string,
  endDate: string
): Promise<Record<string, { waterMl: number; drinksMl: number; totalMl: number }>> {
  // Haal water entries op voor datum range
  const waterEntries = await waterEntriesService.getEntriesByDateRange(startDate, endDate);

  // Haal journal entries op voor datum range met mealType='drink'
  const entries = await db.entries
    .where('date')
    .between(startDate, endDate, true, true)
    .filter(e => !e.deleted && e.mealType === 'drink')
    .toArray();

  // Aggregeer per datum
  const result: Record<string, { waterMl: number; drinksMl: number; totalMl: number }> = {};

  // Initialiseer alle datums in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    result[dateStr] = { waterMl: 0, drinksMl: 0, totalMl: 0 };
  }

  // Voeg water entries toe
  waterEntries.forEach(entry => {
    if (!result[entry.date]) {
      result[entry.date] = { waterMl: 0, drinksMl: 0, totalMl: 0 };
    }
    result[entry.date].waterMl += entry.amount;
    result[entry.date].totalMl += entry.amount;
  });

  // Voeg drink entries toe
  entries.forEach(entry => {
    const totalGrams = entry.products?.reduce((sum, product) => sum + product.grams, 0) || 0;
    if (!result[entry.date]) {
      result[entry.date] = { waterMl: 0, drinksMl: 0, totalMl: 0 };
    }
    result[entry.date].drinksMl += totalGrams;
    result[entry.date].totalMl += totalGrams;
  });

  return result;
}

/**
 * Bereken statistieken voor vocht-inname over een periode
 */
export async function getFluidIntakeStats(
  startDate: string,
  endDate: string
): Promise<{
  totalDays: number;
  daysWithData: number;
  avgFluidPerDay: number;
  avgWaterPerDay: number;
  avgDrinksPerDay: number;
  maxFluidPerDay: number;
  minFluidPerDay: number;
  totalFluid: number;
  totalWater: number;
  totalDrinks: number;
}> {
  const data = await getTotalFluidIntakeByDateRange(startDate, endDate);
  const dates = Object.keys(data);

  // Filter days with data
  const daysWithData = dates.filter(date => data[date].totalMl > 0);

  // Calculate totals
  const totalWater = Object.values(data).reduce((sum, day) => sum + day.waterMl, 0);
  const totalDrinks = Object.values(data).reduce((sum, day) => sum + day.drinksMl, 0);
  const totalFluid = totalWater + totalDrinks;

  // Calculate averages
  const avgWaterPerDay = daysWithData.length > 0 ? Math.round(totalWater / daysWithData.length) : 0;
  const avgDrinksPerDay = daysWithData.length > 0 ? Math.round(totalDrinks / daysWithData.length) : 0;
  const avgFluidPerDay = daysWithData.length > 0 ? Math.round(totalFluid / daysWithData.length) : 0;

  // Calculate min/max
  const amounts = daysWithData.map(date => data[date].totalMl);
  const maxFluidPerDay = amounts.length > 0 ? Math.max(...amounts) : 0;
  const minFluidPerDay = amounts.length > 0 ? Math.min(...amounts) : 0;

  return {
    totalDays: dates.length,
    daysWithData: daysWithData.length,
    avgFluidPerDay,
    avgWaterPerDay,
    avgDrinksPerDay,
    maxFluidPerDay,
    minFluidPerDay,
    totalFluid,
    totalWater,
    totalDrinks,
  };
}

/**
 * Quick helper: bereken totaal voor vandaag
 */
export async function getTodayFluidIntake(): Promise<{
  waterMl: number;
  drinksMl: number;
  totalMl: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  return getTotalFluidIntake(today);
}
