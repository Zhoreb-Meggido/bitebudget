/**
 * Database Types voor Voedseljournaal App
 * Gebaseerd op IndexedDB schema met Dexie.js
 */

// ============================================
// ENTRIES (Maaltijden)
// ============================================

export interface Entry {
  id?: string | number;
  date: string;           // yyyy-MM-dd formaat
  time: string;           // HH:mm formaat
  name: string;           // Naam van de maaltijd
  products?: ProductInEntry[];  // Producten in deze maaltijd
  calories: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
  created_at: string;     // ISO timestamp
  updated_at: string;     // ISO timestamp
}

export interface ProductInEntry {
  name: string;
  grams: number;
}

// ============================================
// PRODUCTS (Product Database)
// ============================================

export interface Product {
  id?: string | number;
  name: string;
  calories: number;       // per 100g
  protein: number;        // per 100g
  fat: number;           // per 100g
  saturatedFat: number;  // per 100g
  fiber: number;         // per 100g
  sodium: number;        // per 100g
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// WEIGHTS (Gewicht Tracking)
// ============================================

export interface Weight {
  id?: string;
  date: string;          // yyyy-MM-dd formaat
  weight: number;        // in kg
  note?: string;
  created_at: string;    // ISO timestamp
}

// ============================================
// SETTINGS
// ============================================

export interface UserSettings {
  caloriesRest: number;
  caloriesSport: number;
  proteinRest: number;
  proteinSport: number;
  saturatedFatMax: number;
  fiberMin: number;
  sodiumMax: number;
  targetWeight: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  caloriesRest: 1900,
  caloriesSport: 2200,
  proteinRest: 110,
  proteinSport: 120,
  saturatedFatMax: 20,
  fiberMin: 35,
  sodiumMax: 2300,
  targetWeight: 78,
};

export interface SettingsRecord {
  key: string;           // PRIMARY KEY
  value?: any;
  values?: object;       // Voor user-settings
  updated_at?: string;
}

// Settings keys
export const SETTINGS_KEYS = {
  USER_SETTINGS: 'user-settings',
  BACKUP_REMINDER_ENABLED: 'backup_reminder_enabled',
  BACKUP_REMINDER_DAYS: 'backup_reminder_days',
  LAST_BACKUP_DATE: 'last_backup_date',
  FIRST_VISIT_DATE: 'first_visit_date',
} as const;

// ============================================
// DAY TYPES
// ============================================

export type DayType = 'rust' | 'sport';

// ============================================
// BACKUP/EXPORT
// ============================================

export interface BackupData {
  version: string;
  timestamp: string;
  entries: Entry[];
  products: Product[];
  weights: Weight[];
  settings: UserSettings;
}

// ============================================
// ANALYTICS
// ============================================

export interface DailyData {
  date: string;
  dayType: DayType;
  calories: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
  weight?: number;
  entryCount: number;
}

export interface DailyStats {
  avg: number;
  min: number;
  max: number;
  total: number;
  count: number;
}

export interface WeekStats {
  weekNumber: number;
  startDate: string;
  endDate: string;
  avgCalories: number;
  avgProtein: number;
  avgSaturatedFat: number;
  avgFiber: number;
  avgSodium: number;
  avgWeight?: number;
  dayCount: number;
}

// ============================================
// METRICS
// ============================================

export type MetricKey = 'calories' | 'protein' | 'saturatedFat' | 'fiber' | 'sodium' | 'weight';

export interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  chartColor: string;
}

export const METRICS: Record<MetricKey, MetricConfig> = {
  calories: {
    key: 'calories',
    label: 'Calorieën',
    unit: 'kcal',
    color: 'blue',
    chartColor: 'rgb(59, 130, 246)',
  },
  protein: {
    key: 'protein',
    label: 'Eiwit',
    unit: 'g',
    color: 'green',
    chartColor: 'rgb(34, 197, 94)',
  },
  saturatedFat: {
    key: 'saturatedFat',
    label: 'Verzadigd Vet',
    unit: 'g',
    color: 'red',
    chartColor: 'rgb(239, 68, 68)',
  },
  fiber: {
    key: 'fiber',
    label: 'Vezels',
    unit: 'g',
    color: 'yellow',
    chartColor: 'rgb(234, 179, 8)',
  },
  sodium: {
    key: 'sodium',
    label: 'Natrium',
    unit: 'mg',
    color: 'purple',
    chartColor: 'rgb(168, 85, 247)',
  },
  weight: {
    key: 'weight',
    label: 'Gewicht',
    unit: 'kg',
    color: 'pink',
    chartColor: 'rgb(236, 72, 153)',
  },
};