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
  carbohydrates: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
  created_at: string;     // ISO timestamp
  updated_at: string;     // ISO timestamp
  deleted?: boolean;      // Soft delete flag
  deleted_at?: string;    // ISO timestamp when deleted
}

export interface ProductInEntry {
  name: string;
  grams: number;
  portionName?: string;  // Optional portion name (v1.4+)
}

// ============================================
// PRODUCT PORTIONS (Portie templates)
// ============================================

export type PortionUnit = 'g' | 'ml' | 'stuks' | 'el' | 'tl';

export interface ProductPortion {
  id?: string | number;
  productName: string;        // Referentie naar Product.name
  portionName: string;        // "1 snee", "1 kop", "1 eetlepel"
  amount: number;             // Hoeveelheid in de gekozen unit
  unit: PortionUnit;          // Eenheid (g, ml, stuks, el, tl)
  gramsPerUnit?: number;      // Voor conversie (bijv. 1 el = 15g)
  grams: number;              // Uiteindelijk aantal grammen
  isDefault: boolean;         // Standaard portie voor dit product
  created_at: string;         // ISO timestamp
  updated_at: string;         // ISO timestamp
  deleted?: boolean;          // Soft delete flag
  deleted_at?: string;        // ISO timestamp when deleted
}

// ============================================
// MEAL TEMPLATES (Maaltijd templates)
// ============================================

export type MealCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack' | 'shake' | 'anders';

export interface MealTemplate {
  id?: string | number;
  name: string;               // "Ontbijt standaard", "Post-workout shake"
  category?: MealCategory;    // Type maaltijd
  products: ProductInEntry[]; // {name, grams, portionName?}[]
  isFavorite?: boolean;       // Pinned bovenaan
  lastUsed?: string;          // ISO timestamp voor recent gebruikt
  useCount?: number;          // Populariteit tracking
  created_at: string;         // ISO timestamp
  updated_at: string;         // ISO timestamp
  deleted?: boolean;          // Soft delete flag
  deleted_at?: string;        // ISO timestamp when deleted
}

// ============================================
// PRODUCTS (Product Database)
// ============================================

export type ProductSource = 'manual' | 'barcode' | 'search';

export interface Product {
  id?: string | number;
  name: string;
  calories: number;       // per 100g
  protein: number;        // per 100g
  carbohydrates: number;  // per 100g
  sugars: number;         // per 100g
  fat: number;           // per 100g
  saturatedFat: number;  // per 100g
  fiber: number;         // per 100g
  sodium: number;        // per 100g (mg)
  favorite: boolean;
  created_at: string;
  updated_at: string;

  // OpenFoodFacts integration (v2.0)
  ean?: string;                    // Barcode/EAN-13
  source: ProductSource;           // How this product was added
  openfoodfacts_id?: string;       // OFF product code (same as EAN)
  nutri_score?: string;            // A-E rating
  image_url?: string;              // Product photo
  brand?: string;                  // Brand name
  last_synced?: string;            // ISO timestamp of last OFF sync

  // Soft delete (v1.2)
  deleted?: boolean;      // Soft delete flag
  deleted_at?: string;    // ISO timestamp when deleted
}

// ============================================
// OPENFOODFACTS API
// ============================================

export interface OpenFoodFactsProduct {
  code: string;                     // EAN barcode
  product_name: string;
  brands?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    fiber_100g?: number;
    sodium_100g?: number;           // In grams! Need to convert to mg
    salt_100g?: number;
  };
  nutriscore_grade?: string;        // a-e (lowercase)
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
}

export interface OpenFoodFactsResponse {
  status: number;                   // 1 = found, 0 = not found
  status_verbose: string;
  code: string;
  product?: OpenFoodFactsProduct;
}

export interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
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
  deleted?: boolean;     // Soft delete flag
  deleted_at?: string;   // ISO timestamp when deleted
}

// ============================================
// SETTINGS
// ============================================

export interface UserSettings {
  caloriesRest: number;
  caloriesSport: number;
  proteinRest: number;
  proteinSport: number;
  carbohydratesMax: number;
  sugarsMax: number;
  fatMax: number;
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
  carbohydratesMax: 250,
  sugarsMax: 50,
  fatMax: 70,
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
  productPortions?: ProductPortion[];  // v1.3+
  mealTemplates?: MealTemplate[];      // v1.3+
}

// ============================================
// ANALYTICS
// ============================================

export interface DailyData {
  date: string;
  dayType: DayType;
  calories: number;
  protein: number;
  carbohydrates: number;
  sugars: number;
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