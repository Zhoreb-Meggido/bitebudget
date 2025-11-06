/**
 * Default Product Portions - Voorgedefinieerde porties voor veelgebruikte producten
 * Users kunnen deze wijzigen/aanvullen
 */

import type { ProductPortion, PortionUnit } from '@/types';

/**
 * Helper functie om conversies te doen
 * Standaard conversies:
 * - 1 eetlepel (el) = 15g
 * - 1 theelepel (tl) = 5g
 * - ml is 1:1 met grammen voor vloeistoffen (melk, water, etc.)
 */
export const UNIT_CONVERSIONS: Record<PortionUnit, number> = {
  g: 1,      // Direct grammen
  ml: 1,     // ml → g (voor vloeistoffen, 1:1 ratio)
  stuks: 0,  // Moet per product gedefinieerd worden
  el: 15,    // 1 eetlepel = 15g (standaard)
  tl: 5,     // 1 theelepel = 5g (standaard)
};

/**
 * Bereken grammen op basis van unit en amount
 */
export function calculateGrams(amount: number, unit: PortionUnit, gramsPerUnit?: number): number {
  if (unit === 'stuks' && gramsPerUnit) {
    return Math.round(amount * gramsPerUnit);
  }
  return Math.round(amount * UNIT_CONVERSIONS[unit]);
}

/**
 * Default porties voor veelgebruikte producten
 * Gegroepeerd per categorie voor overzicht
 */

// Brood & Granen
export const DEFAULT_BREAD_PORTIONS: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    productName: 'Volkoren brood',
    portionName: '1 snee',
    amount: 1,
    unit: 'stuks',
    gramsPerUnit: 35,
    grams: 35,
    isDefault: true,
  },
  {
    productName: 'Volkoren brood',
    portionName: '2 sneetjes',
    amount: 2,
    unit: 'stuks',
    gramsPerUnit: 35,
    grams: 70,
    isDefault: false,
  },
  {
    productName: 'Wit brood',
    portionName: '1 snee',
    amount: 1,
    unit: 'stuks',
    gramsPerUnit: 30,
    grams: 30,
    isDefault: true,
  },
  {
    productName: 'Volkoren toast',
    portionName: '1 snee',
    amount: 1,
    unit: 'stuks',
    gramsPerUnit: 25,
    grams: 25,
    isDefault: true,
  },
  {
    productName: 'Havermout',
    portionName: 'Portie',
    amount: 40,
    unit: 'g',
    grams: 40,
    isDefault: true,
  },
  {
    productName: 'Havermout',
    portionName: 'Grote portie',
    amount: 60,
    unit: 'g',
    grams: 60,
    isDefault: false,
  },
  {
    productName: 'Muesli',
    portionName: 'Portie',
    amount: 50,
    unit: 'g',
    grams: 50,
    isDefault: true,
  },
];

// Zuivel
export const DEFAULT_DAIRY_PORTIONS: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    productName: 'Melk',
    portionName: '1 kop',
    amount: 250,
    unit: 'ml',
    grams: 250,
    isDefault: true,
  },
  {
    productName: 'Melk',
    portionName: '1 glas',
    amount: 200,
    unit: 'ml',
    grams: 200,
    isDefault: false,
  },
  {
    productName: 'Yoghurt',
    portionName: 'Bakje',
    amount: 150,
    unit: 'g',
    grams: 150,
    isDefault: true,
  },
  {
    productName: 'Kwark',
    portionName: 'Bakje',
    amount: 200,
    unit: 'g',
    grams: 200,
    isDefault: true,
  },
  {
    productName: 'Kaas',
    portionName: '1 plak',
    amount: 1,
    unit: 'stuks',
    gramsPerUnit: 20,
    grams: 20,
    isDefault: true,
  },
  {
    productName: 'Kaas',
    portionName: '2 plakken',
    amount: 2,
    unit: 'stuks',
    gramsPerUnit: 20,
    grams: 40,
    isDefault: false,
  },
];

// Eiwit
export const DEFAULT_PROTEIN_PORTIONS: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    productName: 'Whey protein',
    portionName: 'Scoop',
    amount: 30,
    unit: 'g',
    grams: 30,
    isDefault: true,
  },
  {
    productName: 'Whey protein',
    portionName: '2 scoops',
    amount: 60,
    unit: 'g',
    grams: 60,
    isDefault: false,
  },
  {
    productName: 'Kipfilet',
    portionName: 'Portie',
    amount: 150,
    unit: 'g',
    grams: 150,
    isDefault: true,
  },
  {
    productName: 'Kipfilet',
    portionName: 'Grote portie',
    amount: 200,
    unit: 'g',
    grams: 200,
    isDefault: false,
  },
  {
    productName: 'Eieren',
    portionName: '1 ei',
    amount: 1,
    unit: 'stuks',
    gramsPerUnit: 60,
    grams: 60,
    isDefault: true,
  },
  {
    productName: 'Eieren',
    portionName: '2 eieren',
    amount: 2,
    unit: 'stuks',
    gramsPerUnit: 60,
    grams: 120,
    isDefault: false,
  },
  {
    productName: 'Zalm',
    portionName: 'Portie',
    amount: 125,
    unit: 'g',
    grams: 125,
    isDefault: true,
  },
  {
    productName: 'Tonijn (blik)',
    portionName: 'Blikje',
    amount: 150,
    unit: 'g',
    grams: 150,
    isDefault: true,
  },
];

// Beleg
export const DEFAULT_SPREAD_PORTIONS: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    productName: 'Pindakaas',
    portionName: '1 el',
    amount: 1,
    unit: 'el',
    grams: 15,
    isDefault: true,
  },
  {
    productName: 'Pindakaas',
    portionName: '2 el',
    amount: 2,
    unit: 'el',
    grams: 30,
    isDefault: false,
  },
  {
    productName: 'Jam',
    portionName: '1 el',
    amount: 1,
    unit: 'el',
    grams: 15,
    isDefault: true,
  },
  {
    productName: 'Hagelslag',
    portionName: 'Portie',
    amount: 15,
    unit: 'g',
    grams: 15,
    isDefault: true,
  },
  {
    productName: 'Boter',
    portionName: 'Dun',
    amount: 5,
    unit: 'g',
    grams: 5,
    isDefault: true,
  },
  {
    productName: 'Boter',
    portionName: 'Normaal',
    amount: 10,
    unit: 'g',
    grams: 10,
    isDefault: false,
  },
];

// Fruit
export const DEFAULT_FRUIT_PORTIONS: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    productName: 'Banaan',
    portionName: '1 stuk',
    amount: 1,
    unit: 'stuks',
    gramsPerUnit: 120,
    grams: 120,
    isDefault: true,
  },
  {
    productName: 'Appel',
    portionName: '1 stuk',
    amount: 1,
    unit: 'stuks',
    gramsPerUnit: 150,
    grams: 150,
    isDefault: true,
  },
  {
    productName: 'Sinaasappel',
    portionName: '1 stuk',
    amount: 1,
    unit: 'stuks',
    gramsPerUnit: 180,
    grams: 180,
    isDefault: true,
  },
];

// Groenten
export const DEFAULT_VEGETABLE_PORTIONS: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    productName: 'Broccoli',
    portionName: 'Portie',
    amount: 200,
    unit: 'g',
    grams: 200,
    isDefault: true,
  },
  {
    productName: 'Spinazie',
    portionName: 'Portie',
    amount: 200,
    unit: 'g',
    grams: 200,
    isDefault: true,
  },
];

// Koolhydraten
export const DEFAULT_CARB_PORTIONS: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    productName: 'Rijst (gekookt)',
    portionName: 'Portie',
    amount: 150,
    unit: 'g',
    grams: 150,
    isDefault: true,
  },
  {
    productName: 'Rijst (gekookt)',
    portionName: 'Grote portie',
    amount: 200,
    unit: 'g',
    grams: 200,
    isDefault: false,
  },
  {
    productName: 'Pasta (gekookt)',
    portionName: 'Portie',
    amount: 150,
    unit: 'g',
    grams: 150,
    isDefault: true,
  },
  {
    productName: 'Aardappelen (gekookt)',
    portionName: 'Portie',
    amount: 200,
    unit: 'g',
    grams: 200,
    isDefault: true,
  },
];

// Noten & Zaden
export const DEFAULT_NUTS_PORTIONS: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    productName: 'Amandelen',
    portionName: 'Handvol',
    amount: 25,
    unit: 'g',
    grams: 25,
    isDefault: true,
  },
  {
    productName: 'Walnoten',
    portionName: 'Handvol',
    amount: 25,
    unit: 'g',
    grams: 25,
    isDefault: true,
  },
];

/**
 * Alle default porties gecombineerd
 */
export const ALL_DEFAULT_PORTIONS = [
  ...DEFAULT_BREAD_PORTIONS,
  ...DEFAULT_DAIRY_PORTIONS,
  ...DEFAULT_PROTEIN_PORTIONS,
  ...DEFAULT_SPREAD_PORTIONS,
  ...DEFAULT_FRUIT_PORTIONS,
  ...DEFAULT_VEGETABLE_PORTIONS,
  ...DEFAULT_CARB_PORTIONS,
  ...DEFAULT_NUTS_PORTIONS,
];
