/**
 * Nutritional calculations en helper functies
 */

import type { Entry, Product } from '@/types';

/**
 * Bereken totalen van entries
 */
export function calculateTotals(entries: Entry[]) {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbohydrates: acc.carbohydrates + entry.carbohydrates,
      sugars: acc.sugars + entry.sugars,
      fat: acc.fat + entry.fat,
      saturatedFat: acc.saturatedFat + entry.saturatedFat,
      fiber: acc.fiber + entry.fiber,
      sodium: acc.sodium + entry.sodium,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
  );
}

/**
 * Bereken nutrition values op basis van product en hoeveelheid
 */
export function calculateProductNutrition(
  product: Product,
  grams: number
): Omit<Entry, 'id' | 'date' | 'time' | 'name' | 'created_at' | 'updated_at' | 'products'> {
  const multiplier = grams / 100;

  return {
    calories: Math.round(product.calories * multiplier),
    protein: parseFloat((product.protein * multiplier).toFixed(1)),
    carbohydrates: parseFloat((product.carbohydrates * multiplier).toFixed(1)),
    sugars: parseFloat((product.sugars * multiplier).toFixed(1)),
    fat: parseFloat((product.fat * multiplier).toFixed(1)),
    saturatedFat: parseFloat((product.saturatedFat * multiplier).toFixed(1)),
    fiber: parseFloat((product.fiber * multiplier).toFixed(1)),
    sodium: Math.round(product.sodium * multiplier),
  };
}

/**
 * Bereken totalen van meerdere producten
 */
export function calculateMultipleProducts(
  products: Array<{ product: Product; grams: number }>
) {
  return products.reduce(
    (acc, { product, grams }) => {
      const nutrition = calculateProductNutrition(product, grams);
      return {
        calories: acc.calories + nutrition.calories,
        protein: acc.protein + nutrition.protein,
        carbohydrates: acc.carbohydrates + nutrition.carbohydrates,
        sugars: acc.sugars + nutrition.sugars,
        fat: acc.fat + nutrition.fat,
        saturatedFat: acc.saturatedFat + nutrition.saturatedFat,
        fiber: acc.fiber + nutrition.fiber,
        sodium: acc.sodium + nutrition.sodium,
      };
    },
    { calories: 0, protein: 0, carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
  );
}

/**
 * Round nutrition values volgens standaard precisie
 */
export function roundNutritionValues(values: {
  calories: number;
  protein: number;
  carbohydrates: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
}) {
  return {
    calories: Math.round(values.calories),
    protein: parseFloat(values.protein.toFixed(1)),
    carbohydrates: parseFloat(values.carbohydrates.toFixed(1)),
    sugars: parseFloat(values.sugars.toFixed(1)),
    fat: parseFloat(values.fat.toFixed(1)),
    saturatedFat: parseFloat(values.saturatedFat.toFixed(1)),
    fiber: parseFloat(values.fiber.toFixed(1)),
    sodium: Math.round(values.sodium),
  };
}
