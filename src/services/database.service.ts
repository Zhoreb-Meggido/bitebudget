/**
 * DatabaseService - Single source of truth for all database operations
 *
 * Manages IndexedDB via Dexie.js voor:
 * - Entries (maaltijden/voeding)
 * - Products (product database)
 * - Weights (gewicht tracking)
 * - Settings (gebruikersinstellingen)
 */

import Dexie, { Table } from 'dexie';
import type { Entry, Product, Weight, SettingsRecord, ProductPortion, MealTemplate, DailyActivity, DayHeartRateSamples } from '@/types';

export class VoedseljournaalDB extends Dexie {
  // Tables
  entries!: Table<Entry, number>;
  products!: Table<Product, number>;
  weights!: Table<Weight, string>;
  settings!: Table<SettingsRecord, string>;
  productPortions!: Table<ProductPortion, number>;
  mealTemplates!: Table<MealTemplate, number>;
  dailyActivities!: Table<DailyActivity, number>;
  heartRateSamples!: Table<DayHeartRateSamples, string>;

  constructor() {
    super('VoedseljournaalDB');

    // Database version 1
    this.version(1).stores({
      entries: 'id, date, created_at, updated_at',
      products: 'id, name, created_at, updated_at'
    });

    // Database version 2 - add weights
    this.version(2).stores({
      entries: 'id, date, created_at, updated_at',
      products: 'id, name, created_at, updated_at',
      weights: 'id, date, created_at'
    });

    // Database version 3 - add settings
    this.version(3).stores({
      entries: 'id, date, created_at, updated_at',
      products: 'id, name, created_at, updated_at',
      weights: 'id, date, created_at',
      settings: 'key'
    });

    // Version 4 is reserved for backward compatibility (cloud sync)
    // Keep identical to version 3
    this.version(4).stores({
      entries: 'id, date, created_at, updated_at',
      products: 'id, name, created_at, updated_at',
      weights: 'id, date, created_at',
      settings: 'key'
    });

    // Version 5 - Add OpenFoodFacts fields to products
    this.version(5).stores({
      entries: 'id, date, created_at, updated_at',
      products: 'id, name, ean, source, created_at, updated_at',
      weights: 'id, date, created_at',
      settings: 'key'
    }).upgrade(async tx => {
      // Migrate existing products to add 'source' field
      await tx.table('products').toCollection().modify(product => {
        if (!product.source) {
          product.source = 'manual'; // All existing products were added manually
        }
      });
      console.log('✅ Migrated products to v5 (added source field)');
    });

    // Version 6 - Add carbohydrates and sugars to products and entries
    this.version(6).stores({
      entries: 'id, date, created_at, updated_at',
      products: 'id, name, ean, source, created_at, updated_at',
      weights: 'id, date, created_at',
      settings: 'key'
    }).upgrade(async tx => {
      // Migrate existing products to add carbs and sugars fields
      await tx.table('products').toCollection().modify(product => {
        if (product.carbohydrates === undefined) {
          product.carbohydrates = 0;
        }
        if (product.sugars === undefined) {
          product.sugars = 0;
        }
      });
      console.log('✅ Migrated products to v6 (added carbohydrates and sugars)');

      // Migrate existing entries to add carbs and sugars fields
      await tx.table('entries').toCollection().modify(entry => {
        if (entry.carbohydrates === undefined) {
          entry.carbohydrates = 0;
        }
        if (entry.sugars === undefined) {
          entry.sugars = 0;
        }
      });
      console.log('✅ Migrated entries to v6 (added carbohydrates and sugars)');
    });

    // Version 7 - Add product portions and meal templates
    this.version(7).stores({
      entries: 'id, date, created_at, updated_at',
      products: 'id, name, ean, source, created_at, updated_at',
      weights: 'id, date, created_at',
      settings: 'key',
      productPortions: 'id, productName, created_at, updated_at',
      mealTemplates: 'id, name, category, lastUsed, useCount, created_at, updated_at'
    });

    // Version 8 - Add daily activities (Google Fit integration)
    this.version(8).stores({
      entries: 'id, date, created_at, updated_at',
      products: 'id, name, ean, source, created_at, updated_at',
      weights: 'id, date, created_at',
      settings: 'key',
      productPortions: 'id, productName, created_at, updated_at',
      mealTemplates: 'id, name, category, lastUsed, useCount, created_at, updated_at',
      dailyActivities: 'id, date, created_at, updated_at'
    });

    // Version 9 - Add heart rate samples (intraday HR data)
    // PRIMARY KEY: 'date' (YYYY-MM-DD string)
    // Each record contains an array of HR samples for one day (~680 samples per day, every ~2 minutes)
    this.version(9).stores({
      entries: 'id, date, created_at, updated_at',
      products: 'id, name, ean, source, created_at, updated_at',
      weights: 'id, date, created_at',
      settings: 'key',
      productPortions: 'id, productName, created_at, updated_at',
      mealTemplates: 'id, name, category, lastUsed, useCount, created_at, updated_at',
      dailyActivities: 'id, date, created_at, updated_at',
      heartRateSamples: 'date, sampleCount, created_at, updated_at'
    }).upgrade(async tx => {
      console.log('✅ V9: Added heartRateSamples table');
      console.log('📊 Primary key: date (YYYY-MM-DD)');
      console.log('💓 Each record stores array of HR samples for one day');
      console.log('ℹ️ Import Health Connect data to populate');
    });

    // Version 10 - Add body composition fields to weights (bodyFat, boneMass, bmr, source, updated_at)
    // No schema change needed for Dexie (it stores objects as-is), but we add this version
    // to trigger a migration message and ensure proper indexing
    this.version(10).stores({
      entries: 'id, date, created_at, updated_at',
      products: 'id, name, ean, source, created_at, updated_at',
      weights: 'id, date, created_at, updated_at',  // Added updated_at index
      settings: 'key',
      productPortions: 'id, productName, created_at, updated_at',
      mealTemplates: 'id, name, category, lastUsed, useCount, created_at, updated_at',
      dailyActivities: 'id, date, created_at, updated_at',
      heartRateSamples: 'date, sampleCount, created_at, updated_at'
    }).upgrade(async tx => {
      console.log('✅ V10: Added body composition support to weights');
      console.log('🏋️ New fields: bodyFat, boneMass, bmr, source, updated_at');
      console.log('💡 Existing weights are preserved, new fields are optional');
      console.log('📱 Import Health Connect data to populate body composition');
    });
  }
}

class DatabaseService {
  private static instance: DatabaseService;
  public db: VoedseljournaalDB;
  private readonly MIGRATION_KEY = 'indexeddb_migrated_v2';

  private constructor() {
    this.db = new VoedseljournaalDB();
  }

  /**
   * Singleton pattern - one instance voor de hele app
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialiseer database en voer migratie uit indien nodig
   */
  public async init(): Promise<void> {
    console.log('🔧 Initializing database...');

    // Database is automatisch geopend door Dexie
    // Set global reference voor backward compatibility (wordt later verwijderd)
    (window as any).db = this.db;

    console.log('✅ Database initialized');

    // Migreer oude localStorage data indien aanwezig
    await this.migrateFromLocalStorage();
  }

  /**
   * Eenmalige migratie van localStorage naar IndexedDB
   */
  private async migrateFromLocalStorage(): Promise<void> {
    if (localStorage.getItem(this.MIGRATION_KEY)) {
      console.log('📊 Migration already completed');
      return;
    }

    console.log('🔄 Starting migration from localStorage...');

    try {
      const now = new Date().toISOString();

      // Migreer entries
      const savedEntries = localStorage.getItem('foodJournalEntries');
      if (savedEntries) {
        const entries = JSON.parse(savedEntries) as Entry[];
        const migratedEntries = entries.map(entry => ({
          ...entry,
          created_at: entry.created_at || now,
          updated_at: entry.updated_at || now
        }));
        await this.db.entries.bulkPut(migratedEntries);
        console.log(`✅ Migrated ${migratedEntries.length} entries`);
      }

      // Migreer products
      const savedProducts = localStorage.getItem('foodProductDatabase');
      if (savedProducts) {
        const products = JSON.parse(savedProducts) as Product[];
        const migratedProducts = products.map(product => ({
          ...product,
          created_at: product.created_at || now,
          updated_at: product.updated_at || now
        }));
        await this.db.products.bulkPut(migratedProducts);
        console.log(`✅ Migrated ${migratedProducts.length} products`);
      }

      // Mark migratie als voltooid
      localStorage.setItem(this.MIGRATION_KEY, 'true');
      console.log('✅ Migration completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get database instance (voor direct gebruik)
   */
  public getDatabase(): VoedseljournaalDB {
    return this.db;
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();

// Export db voor makkelijke toegang
export const db = databaseService.db;

// Default export
export default databaseService;