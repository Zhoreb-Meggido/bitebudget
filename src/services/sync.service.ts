/**
 * Sync Service - Combines encryption + Google Drive
 */

import { encryptionService } from './encryption.service';
import { googleDriveService } from './googledrive.service';
import { entriesService } from './entries.service';
import { productsService } from './products.service';
import { weightsService } from './weights.service';
import { settingsService } from './settings.service';
import { portionsService } from './portions.service';
import { templatesService } from './templates.service';
import { activitiesService } from './activities.service';
import { heartRateSamplesService } from './heart-rate-samples.service';
import { sleepStagesService } from './sleep-stages.service';
import { db } from './database.service';
import { BACKUP_SCHEMA_VERSION } from '@/constants/versions';
import type { Entry, Product, Weight, UserSettings, ProductPortion, MealTemplate, DailyActivity, DayHeartRateSamples, DaySleepStages } from '@/types';

export interface SyncData {
  version: string;
  timestamp: string;
  entries: Entry[];
  products: Product[];
  weights: Weight[];
  settings: UserSettings;
  settingsUpdatedAt?: string;          // v1.6.3+ - timestamp for settings
  productPortions?: ProductPortion[];  // v1.3+
  mealTemplates?: MealTemplate[];      // v1.3+
  dailyActivities?: DailyActivity[];   // v1.5+
  heartRateSamples?: DayHeartRateSamples[];  // v1.6+ - 75 day retention
  sleepStages?: DaySleepStages[];      // v1.10+ - 75 day retention
}

class SyncService {
  private autoSyncEnabled: boolean = false;
  private autoSyncInterval: number | null = null;
  private syncDebounceTimeout: number | null = null;
  private isSyncing: boolean = false; // Lock to prevent concurrent syncs

  constructor() {
    // Restore auto-sync state on startup
    this.initializeAutoSync();
  }

  /**
   * Initialize auto-sync on app startup if it was previously enabled
   */
  private initializeAutoSync(): void {
    const autoSyncEnabled = localStorage.getItem('auto_sync_enabled') === 'true';
    const password = this.getStoredPassword();

    if (autoSyncEnabled && password) {
      this.autoSyncEnabled = true;
      this.startAutoSyncInterval(password);
      console.log('Auto-sync restored from previous session');
    }
  }

  /**
   * Start the auto-sync interval timer
   */
  private startAutoSyncInterval(password: string): void {
    // Clear existing interval if any
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    // Bidirectional sync every 5 minutes (pull + push)
    this.autoSyncInterval = window.setInterval(async () => {
      try {
        console.log('⏰ Auto-sync: Running periodic sync...');
        await this.syncToCloud(password, false); // Smart merge (not force)
      } catch (error) {
        console.error('Auto-sync failed:', error);

        // Check if failure was due to token expiry
        if (!googleDriveService.isSignedIn()) {
          window.dispatchEvent(new CustomEvent('google-drive-token-expired'));
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Enable auto-sync (bidirectional sync every 5 minutes)
   */
  enableAutoSync(password: string): void {
    this.autoSyncEnabled = true;
    this.storePassword(password);
    localStorage.setItem('auto_sync_enabled', 'true');

    this.startAutoSyncInterval(password);
  }

  /**
   * Disable auto-sync
   */
  disableAutoSync(): void {
    this.autoSyncEnabled = false;
    localStorage.setItem('auto_sync_enabled', 'false');

    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  /**
   * Trigger auto-sync upload (debounced - waits 30 seconds after last change)
   */
  triggerAutoSync(): void {
    if (!this.autoSyncEnabled) return;

    const password = this.getStoredPassword();
    if (!password) return;

    // Check if token is still valid before attempting sync
    if (!googleDriveService.isSignedIn()) {
      console.warn('Auto-sync: Token expired, dispatching warning event');
      window.dispatchEvent(new CustomEvent('google-drive-token-expired'));
      return;
    }

    // Clear existing timeout
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
    }

    // Set new timeout
    this.syncDebounceTimeout = window.setTimeout(async () => {
      try {
        await this.syncToCloud(password);
        console.log('Auto-sync: Data uploaded to Drive');
      } catch (error) {
        console.error('Auto-sync upload failed:', error);

        // Check if failure was due to token expiry
        if (!googleDriveService.isSignedIn()) {
          window.dispatchEvent(new CustomEvent('google-drive-token-expired'));
        }
      }
    }, 30 * 1000); // 30 seconds debounce
  }

  /**
   * Check if there's newer data in the cloud and merge if so
   */
  async pullIfNewer(password: string): Promise<boolean> {
    if (!googleDriveService.isSignedIn()) {
      return false;
    }

    try {
      // Get cloud file info
      const cloudInfo = await googleDriveService.getLastSyncInfo();
      if (!cloudInfo) return false;

      // Get local last sync time
      const localLastSync = this.getLastSyncTime();

      // If cloud is newer, pull and merge
      if (!localLastSync || cloudInfo.date > localLastSync) {
        console.log('Auto-sync: Cloud data is newer, merging...');
        const cloudData = await this.downloadCloudData(password);
        if (cloudData) {
          await this.mergeData(cloudData);
          localStorage.setItem('last_sync_time', new Date().toISOString());
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Pull check failed:', error);
      return false;
    }
  }

  /**
   * Check if auto-sync is enabled
   */
  isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  /**
   * Cleanup old soft-deleted items (>14 days)
   * Permanently removes items that have been deleted for more than 2 weeks
   */
  async cleanupOldDeletedItems(): Promise<void> {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const cutoffDate = twoWeeksAgo.toISOString();

    try {
      // Cleanup entries
      const entries = await entriesService.getAllEntriesIncludingDeleted();
      const oldDeletedEntries = entries.filter(
        e => e.deleted && e.deleted_at && e.deleted_at < cutoffDate
      );
      for (const entry of oldDeletedEntries) {
        if (entry.id && typeof entry.id === 'number') {
          await db.entries.delete(entry.id);
        }
      }
      if (oldDeletedEntries.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedEntries.length} old deleted entries`);
      }

      // Cleanup products
      const products = await productsService.getAllProductsIncludingDeleted();
      const oldDeletedProducts = products.filter(
        p => p.deleted && p.deleted_at && p.deleted_at < cutoffDate
      );
      for (const product of oldDeletedProducts) {
        if (product.id && typeof product.id === 'number') {
          await db.products.delete(product.id);
        }
      }
      if (oldDeletedProducts.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedProducts.length} old deleted products`);
      }

      // Cleanup weights
      const weights = await weightsService.getAllWeights();
      const oldDeletedWeights = weights.filter(
        w => w.deleted && w.deleted_at && w.deleted_at < cutoffDate
      );
      for (const weight of oldDeletedWeights) {
        if (weight.id && typeof weight.id === 'number') {
          await db.weights.delete(weight.id);
        }
      }
      if (oldDeletedWeights.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedWeights.length} old deleted weights`);
      }

      // Cleanup product portions
      const portions = await portionsService.getAllPortionsIncludingDeleted();
      const oldDeletedPortions = portions.filter(
        p => p.deleted && p.deleted_at && p.deleted_at < cutoffDate
      );
      for (const portion of oldDeletedPortions) {
        if (portion.id && typeof portion.id === 'number') {
          await db.productPortions.delete(portion.id);
        }
      }
      if (oldDeletedPortions.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedPortions.length} old deleted portions`);
      }

      // Cleanup meal templates
      const templates = await templatesService.getAllTemplatesIncludingDeleted();
      const oldDeletedTemplates = templates.filter(
        t => t.deleted && t.deleted_at && t.deleted_at < cutoffDate
      );
      for (const template of oldDeletedTemplates) {
        if (template.id && typeof template.id === 'number') {
          await db.mealTemplates.delete(template.id);
        }
      }
      if (oldDeletedTemplates.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedTemplates.length} old deleted templates`);
      }

      // Cleanup heart rate samples
      const hrSamples = await heartRateSamplesService.getAllSamplesIncludingDeleted();
      const oldDeletedHRSamples = hrSamples.filter(
        h => h.deleted && h.deleted_at && h.deleted_at < cutoffDate
      );
      for (const sample of oldDeletedHRSamples) {
        await db.heartRateSamples.delete(sample.date);
      }
      if (oldDeletedHRSamples.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedHRSamples.length} old deleted HR sample days`);
      }

      // Cleanup sleep stages
      const sleepStages = await sleepStagesService.getAllStagesIncludingDeleted();
      const oldDeletedSleepStages = sleepStages.filter(
        s => s.deleted && s.deleted_at && s.deleted_at < cutoffDate
      );
      for (const stage of oldDeletedSleepStages) {
        await db.sleepStages.delete(stage.date);
      }
      if (oldDeletedSleepStages.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedSleepStages.length} old deleted sleep stage nights`);
      }
    } catch (error) {
      console.error('❌ Error during cleanup of old deleted items:', error);
    }
  }

  /**
   * Export all data for sync
   */
  async exportAllData(): Promise<SyncData> {
    const entries = await entriesService.getAllEntriesIncludingDeleted();
    const products = await productsService.getAllProductsIncludingDeleted();
    const weights = await weightsService.getAllWeights(); // Already includes deleted
    const settingsRecord = await settingsService.getSettingsRecord();
    let settings = settingsRecord.settings;
    const settingsUpdatedAt = settingsRecord.updated_at;
    const productPortions = await portionsService.getAllPortionsIncludingDeleted();
    const mealTemplates = await templatesService.getAllTemplatesIncludingDeleted();
    const dailyActivities = await activitiesService.getAllActivitiesIncludingDeleted();
    const heartRateSamples = await heartRateSamplesService.getAllSamplesIncludingDeleted();
    const sleepStages = await sleepStagesService.getAllStagesIncludingDeleted();

    // Ensure old rust/sport day fields are removed from settings before export
    const settingsClean = { ...settings } as any;
    delete settingsClean.caloriesRest;
    delete settingsClean.caloriesSport;
    delete settingsClean.proteinRest;
    delete settingsClean.proteinSport;
    settings = settingsClean;

    // Count soft-deleted items
    const entriesDeleted = entries.filter(e => e.deleted === true).length;
    const productsDeleted = products.filter(p => p.deleted === true).length;
    const weightsDeleted = weights.filter(w => w.deleted === true).length;
    const portionsDeleted = productPortions.filter(p => p.deleted === true).length;
    const templatesDeleted = mealTemplates.filter(t => t.deleted === true).length;
    const activitiesDeleted = dailyActivities.filter(a => a.deleted === true).length;
    const hrSamplesDeleted = heartRateSamples.filter(h => h.deleted === true).length;
    const sleepStagesDeleted = sleepStages.filter(s => s.deleted === true).length;

    console.log('📤 Preparing export with:', {
      entries: `${entries.length} (${entriesDeleted} deleted)`,
      products: `${products.length} (${productsDeleted} deleted)`,
      weights: `${weights.length} (${weightsDeleted} deleted)`,
      settings: '✓',
      productPortions: `${productPortions.length} (${portionsDeleted} deleted)`,
      mealTemplates: `${mealTemplates.length} (${templatesDeleted} deleted)`,
      dailyActivities: `${dailyActivities.length} (${activitiesDeleted} deleted)`,
      heartRateSamples: `${heartRateSamples.length} (${hrSamplesDeleted} deleted)`,
      sleepStages: `${sleepStages.length} (${sleepStagesDeleted} deleted)`,
    });

    return {
      version: BACKUP_SCHEMA_VERSION.CURRENT,
      timestamp: new Date().toISOString(),
      entries,
      products,
      weights,
      settings,
      settingsUpdatedAt,
      productPortions,
      mealTemplates,
      dailyActivities,
      heartRateSamples,
      sleepStages,
    };
  }

  /**
   * Merge cloud data with local data (smart merge - keeps newest of each item)
   */
  async mergeData(cloudData: SyncData): Promise<void> {
    console.log('📥 Merging cloud data version:', cloudData.version);

    // Count soft-deleted items in cloud data
    const cloudEntriesDeleted = cloudData.entries?.filter(e => e.deleted === true).length || 0;
    const cloudProductsDeleted = cloudData.products?.filter(p => p.deleted === true).length || 0;
    const cloudWeightsDeleted = cloudData.weights?.filter(w => w.deleted === true).length || 0;
    const cloudPortionsDeleted = cloudData.productPortions?.filter(p => p.deleted === true).length || 0;
    const cloudTemplatesDeleted = cloudData.mealTemplates?.filter(t => t.deleted === true).length || 0;
    const cloudActivitiesDeleted = cloudData.dailyActivities?.filter(a => a.deleted === true).length || 0;
    const cloudHRSamplesDeleted = cloudData.heartRateSamples?.filter(h => h.deleted === true).length || 0;

    console.log('📊 Cloud data contains:', {
      entries: `${cloudData.entries?.length || 0} (${cloudEntriesDeleted} deleted)`,
      products: `${cloudData.products?.length || 0} (${cloudProductsDeleted} deleted)`,
      weights: `${cloudData.weights?.length || 0} (${cloudWeightsDeleted} deleted)`,
      productPortions: `${cloudData.productPortions?.length || 0} (${cloudPortionsDeleted} deleted)`,
      mealTemplates: `${cloudData.mealTemplates?.length || 0} (${cloudTemplatesDeleted} deleted)`,
      dailyActivities: `${cloudData.dailyActivities?.length || 0} (${cloudActivitiesDeleted} deleted)`,
      heartRateSamples: `${cloudData.heartRateSamples?.length || 0} (${cloudHRSamplesDeleted} deleted)`,
    });

    // Get existing local data (including deleted for proper merge)
    const localEntries = await entriesService.getAllEntriesIncludingDeleted();
    const localProducts = await productsService.getAllProductsIncludingDeleted();
    const localWeights = await weightsService.getAllWeights();

    // Create maps for faster lookup (using composite keys for entries/weights)
    const localEntriesMap = new Map(localEntries.map(e => [`${e.date}-${e.time}-${e.name}`, e]));
    const localEntriesById = new Map(localEntries.map(e => [e.id, e]));
    const localProductsMap = new Map(localProducts.map(p => [p.name, p]));
    const localProductsByEan = new Map(localProducts.filter(p => p.ean).map(p => [p.ean!, p]));
    const localWeightsMap = new Map(localWeights.map(w => [w.date, w]));

    // Merge entries - add cloud entries that don't exist locally or are newer
    console.log(`🍽️ Merging ${cloudData.entries.length} entries from cloud...`);
    let entriesAdded = 0;
    let entriesUpdated = 0;
    let entriesSkipped = 0;

    for (const cloudEntry of cloudData.entries) {
      const key = `${cloudEntry.date}-${cloudEntry.time}-${cloudEntry.name}`;
      let localEntry = localEntriesMap.get(key);
      const existingById = localEntriesById.get(cloudEntry.id);

      // Check if ID already exists with different data (ID conflict - e.g., time was changed)
      if (existingById) {
        const existingKey = `${existingById.date}-${existingById.time}-${existingById.name}`;
        if (existingKey !== key) {
          // ID conflict - same ID but different time/name
          // This happens when user edits time/name after sync
          console.log(`⚠️ ID conflict for entry ${cloudEntry.id}: "${existingKey}" vs "${key}"`);

          // Use the existing entry by ID (not by key) for comparison
          localEntry = existingById;
        }
        // Same ID, same key - will be handled by update logic below
      }

      // New entry from cloud - doesn't exist by key or ID
      if (!localEntry && !existingById) {
        console.log(`➕ Adding new entry from cloud: ${key}`);
        try {
          // Use db.entries.add directly to preserve cloud ID (don't generate new ID)
          await db.entries.add(cloudEntry);
          entriesAdded++;
        } catch (err) {
          console.error(`❌ Failed to add entry ${key}:`, err);
        }
      } else if (!localEntry && existingById) {
        // ID exists but points to different entry - already handled by ID conflict logic above
        // Skip this entry to avoid duplicates
        console.log(`⚠️ Skipping cloud entry with ID conflict: ${key}`);
        entriesSkipped++;
      } else if (localEntry && cloudEntry.updated_at && localEntry.updated_at &&
                 new Date(cloudEntry.updated_at) > new Date(localEntry.updated_at)) {
        // Cloud entry is newer - propagate all changes including deletion
        console.log(`🔄 Updating entry (cloud is newer): ${key}`);
        // Use db.entries.update directly to preserve cloud timestamp (don't create new one)
        const { id, ...cloudData } = cloudEntry;
        if (typeof localEntry.id === 'number') {
          await db.entries.update(localEntry.id, cloudData);
          entriesUpdated++;
        }
      } else {
        entriesSkipped++;
      }
    }

    console.log(`✅ Entries merge complete: ${entriesAdded} added, ${entriesUpdated} updated, ${entriesSkipped} skipped`);

    // Merge products - add cloud products that don't exist locally or are newer
    console.log(`🥗 Merging ${cloudData.products.length} products from cloud...`);
    let productsAdded = 0;
    let productsUpdated = 0;
    let productsSkipped = 0;

    for (const cloudProduct of cloudData.products) {
      // Check for existing product by name OR by EAN (barcode) OR by ID
      let localProduct = localProductsMap.get(cloudProduct.name);

      // If not found by name, check by EAN (barcode)
      if (!localProduct && cloudProduct.ean) {
        localProduct = localProductsByEan.get(cloudProduct.ean);
      }

      // If still not found by name or EAN, check by ID
      // This handles cases where a product was renamed but has the same ID
      if (!localProduct && cloudProduct.id) {
        localProduct = localProducts.find(p => p.id === cloudProduct.id);

        if (localProduct) {
          console.log(`⚠️ Found product by ID with different name: "${localProduct.name}" → "${cloudProduct.name}"`);
        }
      }

      if (!localProduct) {
        // New product from cloud - doesn't exist by name, barcode, or ID
        try {
          // Use db.products.add directly to preserve cloud ID (don't generate new ID)
          await db.products.add(cloudProduct);
          productsAdded++;
        } catch (err) {
          console.error(`❌ Failed to add product ${cloudProduct.name}:`, err);
          productsSkipped++;
        }
      } else if (cloudProduct.updated_at && localProduct.updated_at &&
                 new Date(cloudProduct.updated_at) > new Date(localProduct.updated_at)) {
        // Cloud product is newer - propagate all changes including deletion (including name changes)
        // Use db.products.update directly to preserve cloud timestamp (don't create new one)
        const { id, ...cloudData } = cloudProduct;
        if (typeof localProduct.id === 'number') {
          await db.products.update(localProduct.id, cloudData);
          productsUpdated++;
        }
      } else {
        productsSkipped++;
      }
    }

    console.log(`✅ Products merge complete: ${productsAdded} added, ${productsUpdated} updated, ${productsSkipped} skipped`);

    // Merge weights - add cloud weights that don't exist locally or are newer
    if (cloudData.weights) {
      console.log(`⚖️ Merging ${cloudData.weights.length} weights from cloud...`);
      let weightsAdded = 0;
      let weightsUpdated = 0;
      let weightsSkipped = 0;

      for (const cloudWeight of cloudData.weights) {
        const localWeight = localWeightsMap.get(cloudWeight.date);

        if (!localWeight) {
          // New weight from cloud
          // Use db.weights.add directly to preserve cloud ID (don't generate new ID)
          await db.weights.add(cloudWeight);
          weightsAdded++;
        } else {
          // Determine which is newer: use deleted_at if deleted, otherwise created_at
          const cloudTimestamp = cloudWeight.deleted && cloudWeight.deleted_at
            ? cloudWeight.deleted_at
            : cloudWeight.created_at;
          const localTimestamp = localWeight.deleted && localWeight.deleted_at
            ? localWeight.deleted_at
            : localWeight.created_at;

          if (cloudTimestamp && localTimestamp && new Date(cloudTimestamp) > new Date(localTimestamp)) {
            // Cloud weight is newer - propagate all changes including deletion
            // Use db.weights.update directly to preserve cloud timestamp (don't create new one)
            const { id, ...cloudData } = cloudWeight;
            await db.weights.update(localWeight.id!, cloudData);
            weightsUpdated++;
          } else {
            weightsSkipped++;
          }
        }
      }

      console.log(`✅ Weights merge complete: ${weightsAdded} added, ${weightsUpdated} updated, ${weightsSkipped} skipped`);
    }

    // Merge settings - use timestamp to determine which settings to keep
    if (cloudData.settings) {
      // Get current local settings with timestamp
      const localSettingsRecord = await settingsService.getSettingsRecord();
      const localSettings = localSettingsRecord.settings;
      const localUpdatedAt = localSettingsRecord.updated_at;

      const cloudSettings = cloudData.settings as any;
      const cloudUpdatedAt = cloudData.settingsUpdatedAt;

      // Migrate old rust/sport day settings if they exist in cloud data
      if (cloudSettings.caloriesRest !== undefined || cloudSettings.caloriesSport !== undefined) {
        console.log('🔄 Migrating old rust/sport day settings from cloud data...');

        // Use new field if it exists, otherwise use sport day values (more realistic for active users)
        cloudSettings.calories = cloudSettings.calories ?? (cloudSettings.caloriesSport || cloudSettings.caloriesRest);
        cloudSettings.protein = cloudSettings.protein ?? (cloudSettings.proteinSport || cloudSettings.proteinRest);

        // Remove old fields
        delete cloudSettings.caloriesRest;
        delete cloudSettings.caloriesSport;
        delete cloudSettings.proteinRest;
        delete cloudSettings.proteinSport;
      }

      // Compare timestamps to determine which settings to use
      if (cloudUpdatedAt && new Date(cloudUpdatedAt) > new Date(localUpdatedAt)) {
        // Cloud settings are newer - use cloud settings
        console.log('🔄 Cloud settings are newer, updating local settings');
        await settingsService.saveSettings(cloudSettings);
      } else {
        // Local settings are newer or same age - keep local
        console.log('✓ Local settings are up to date, keeping local values');
        // Don't save cloud settings - keep local
      }
    }

    // Merge product portions - add cloud portions that don't exist locally or are newer
    if (cloudData.productPortions && cloudData.productPortions.length > 0) {
      console.log(`📦 Merging ${cloudData.productPortions.length} portions from cloud...`);
      const localPortions = await portionsService.getAllPortionsIncludingDeleted();
      const localPortionsMap = new Map(localPortions.map(p => [`${p.productName}-${p.portionName}`, p]));
      const localPortionsById = new Map(localPortions.map(p => [p.id, p]));

      let addedCount = 0;
      let updatedCount = 0;

      for (const cloudPortion of cloudData.productPortions) {
        try {
          const key = `${cloudPortion.productName}-${cloudPortion.portionName}`;
          const localPortion = localPortionsMap.get(key);
          const existingById = localPortionsById.get(cloudPortion.id);

          // Check if ID already exists with different data (ID conflict)
          if (existingById) {
            const existingKey = `${existingById.productName}-${existingById.portionName}`;
            if (existingKey !== key) {
              // ID conflict - same ID but different portion, generate new ID
              console.log(`⚠️ ID conflict for portion ${cloudPortion.id}: "${existingKey}" vs "${key}"`);
              const newId = Date.now() + Math.random();
              await db.productPortions.add({ ...cloudPortion, id: newId });
              addedCount++;
              continue;
            }
            // Same ID, same portion - will be handled by update logic below
          }

          if (!localPortion) {
            // New portion from cloud
            if (!existingById) {
              // No ID conflict - safe to add with cloud ID
              await db.productPortions.add(cloudPortion);
              addedCount++;
            }
            // If existingById exists but localPortion doesn't, it means the ID exists
            // but points to a different portion - already handled above
          } else if (cloudPortion.updated_at && localPortion.updated_at &&
                     new Date(cloudPortion.updated_at) > new Date(localPortion.updated_at)) {
            // Cloud portion is newer - use cloud data but keep local ID to avoid duplicates
            const { id, ...cloudData } = cloudPortion;
            if (typeof localPortion.id === 'number') {
              await db.productPortions.update(localPortion.id, cloudData);
              updatedCount++;
            }
          }
        } catch (err) {
          console.error(`❌ Error processing portion ${cloudPortion.productName} - ${cloudPortion.portionName}:`, err);
          throw err;
        }
      }

      console.log(`✅ Portions: ${addedCount} added, ${updatedCount} updated`);
    } else {
      console.log('ℹ️ No portions in cloud backup (might be older version)');
    }

    // Merge meal templates - add cloud templates that don't exist locally or are newer
    if (cloudData.mealTemplates && cloudData.mealTemplates.length > 0) {
      console.log(`⭐ Merging ${cloudData.mealTemplates.length} templates from cloud...`);
      const localTemplates = await templatesService.getAllTemplatesIncludingDeleted();
      const localTemplatesMap = new Map(localTemplates.map(t => [t.name, t]));
      const localTemplatesById = new Map(localTemplates.map(t => [t.id, t]));

      let addedCount = 0;
      let updatedCount = 0;

      for (const cloudTemplate of cloudData.mealTemplates) {
        try {
          const localTemplate = localTemplatesMap.get(cloudTemplate.name);
          const existingById = localTemplatesById.get(cloudTemplate.id);

          // Check if ID already exists with different data (ID conflict)
          if (existingById) {
            if (existingById.name !== cloudTemplate.name) {
              // ID conflict - same ID but different template, generate new ID
              console.log(`⚠️ ID conflict for template ${cloudTemplate.id}: "${existingById.name}" vs "${cloudTemplate.name}"`);
              const newId = Date.now() + Math.random();
              await db.mealTemplates.add({ ...cloudTemplate, id: newId });
              addedCount++;
              continue;
            }
            // Same ID, same template - will be handled by update logic below
          }

          if (!localTemplate) {
            // New template from cloud
            if (!existingById) {
              // No ID conflict - safe to add with cloud ID
              await db.mealTemplates.add(cloudTemplate);
              addedCount++;
            }
            // If existingById exists but localTemplate doesn't, it means the ID exists
            // but points to a different template - already handled above
          } else if (cloudTemplate.updated_at && localTemplate.updated_at &&
                     new Date(cloudTemplate.updated_at) > new Date(localTemplate.updated_at)) {
            // Cloud template is newer - use cloud data but keep local ID to avoid duplicates
            const { id, ...cloudData } = cloudTemplate;
            if (typeof localTemplate.id === 'number') {
              await db.mealTemplates.update(localTemplate.id, cloudData);
              updatedCount++;
            }
          }
        } catch (err) {
          console.error(`❌ Error processing template ${cloudTemplate.name}:`, err);
          throw err;
        }
      }

      console.log(`✅ Templates: ${addedCount} added, ${updatedCount} updated`);
    } else {
      console.log('ℹ️ No templates in cloud backup (might be older version)');
    }

    // Merge daily activities - add cloud activities that don't exist locally or are newer
    if (cloudData.dailyActivities && cloudData.dailyActivities.length > 0) {
      console.log(`🏃 Merging ${cloudData.dailyActivities.length} daily activities from cloud...`);
      const localActivities = await activitiesService.getAllActivitiesIncludingDeleted();
      const localActivitiesMap = new Map(localActivities.map(a => [a.date, a]));

      let addedCount = 0;
      let updatedCount = 0;

      for (const cloudActivity of cloudData.dailyActivities) {
        try {
          const localActivity = localActivitiesMap.get(cloudActivity.date);

          if (!localActivity) {
            // New activity from cloud
            await db.dailyActivities.add(cloudActivity);
            addedCount++;
          } else if (cloudActivity.updated_at && localActivity.updated_at &&
                     new Date(cloudActivity.updated_at) > new Date(localActivity.updated_at)) {
            // Cloud activity is newer - use cloud data but keep local ID
            const { id, ...cloudData } = cloudActivity;
            if (typeof localActivity.id === 'number') {
              await db.dailyActivities.update(localActivity.id, cloudData);
              updatedCount++;
            }
          }
        } catch (err) {
          console.error(`❌ Error processing activity ${cloudActivity.date}:`, err);
          throw err;
        }
      }

      console.log(`✅ Activities: ${addedCount} added, ${updatedCount} updated`);
    } else {
      console.log('ℹ️ No activities in cloud backup (might be older version)');
    }

    // Merge heart rate samples - add cloud samples that don't exist locally or are newer
    if (cloudData.heartRateSamples && cloudData.heartRateSamples.length > 0) {
      console.log(`💓 Merging ${cloudData.heartRateSamples.length} HR sample days from cloud...`);
      const localSamples = await heartRateSamplesService.getAllSamplesIncludingDeleted();
      const localSamplesMap = new Map(localSamples.map(s => [s.date, s]));

      let addedCount = 0;
      let updatedCount = 0;

      for (const cloudSample of cloudData.heartRateSamples) {
        try {
          const localSample = localSamplesMap.get(cloudSample.date);

          if (!localSample) {
            // New HR sample day from cloud - use put() which handles primary key (date)
            await db.heartRateSamples.put(cloudSample);
            addedCount++;
          } else if (cloudSample.updated_at && localSample.updated_at &&
                     new Date(cloudSample.updated_at) > new Date(localSample.updated_at)) {
            // Cloud sample is newer - replace with cloud data
            await db.heartRateSamples.put(cloudSample);
            updatedCount++;
          }
        } catch (err) {
          console.error(`❌ Error processing HR samples ${cloudSample.date}:`, err);
          throw err;
        }
      }

      console.log(`✅ HR Samples: ${addedCount} added, ${updatedCount} updated`);
    } else {
      console.log('ℹ️ No HR samples in cloud backup (might be older version)');
    }

    // Merge sleep stages - add cloud stages that don't exist locally or are newer
    if (cloudData.sleepStages && cloudData.sleepStages.length > 0) {
      console.log(`😴 Merging ${cloudData.sleepStages.length} sleep stage nights from cloud...`);
      const localStages = await sleepStagesService.getAllStagesIncludingDeleted();
      const localStagesMap = new Map(localStages.map(s => [s.date, s]));

      let addedCount = 0;
      let updatedCount = 0;

      for (const cloudStage of cloudData.sleepStages) {
        try {
          const localStage = localStagesMap.get(cloudStage.date);

          if (!localStage) {
            // New sleep stage night from cloud - use put() which handles primary key (date)
            await db.sleepStages.put(cloudStage);
            addedCount++;
          } else if (cloudStage.updated_at && localStage.updated_at &&
                     new Date(cloudStage.updated_at) > new Date(localStage.updated_at)) {
            // Cloud stage is newer - replace with cloud data
            await db.sleepStages.put(cloudStage);
            updatedCount++;
          }
        } catch (err) {
          console.error(`❌ Error processing sleep stages ${cloudStage.date}:`, err);
          throw err;
        }
      }

      console.log(`✅ Sleep Stages: ${addedCount} added, ${updatedCount} updated`);
    } else {
      console.log('ℹ️ No sleep stages in cloud backup (might be older version)');
    }
  }

  /**
   * Import all data from sync (full restore - overwrites everything)
   * This is for manual "Restore from Drive" action only
   */
  async importAllData(data: SyncData): Promise<void> {
    // Clear existing data
    const existingEntries = await entriesService.getAllEntries();
    const existingProducts = await productsService.getAllProducts();
    const existingWeights = await weightsService.getAllWeights();

    for (const entry of existingEntries) {
      if (entry.id) await entriesService.deleteEntry(entry.id);
    }

    for (const product of existingProducts) {
      if (product.id) await productsService.deleteProduct(product.id);
    }

    for (const weight of existingWeights) {
      if (weight.id) await weightsService.deleteWeight(weight.id);
    }

    // Import new data
    let productsAdded = 0;
    let productsFailed = 0;
    for (const product of data.products) {
      try {
        await productsService.addProduct(product);
        productsAdded++;
      } catch (err) {
        console.warn('Failed to import product:', product.name, err);
        productsFailed++;
      }
    }
    console.log(`✅ Imported ${productsAdded} products (${productsFailed} failed)`);

    let entriesAdded = 0;
    let entriesFailed = 0;
    for (const entry of data.entries) {
      try {
        await entriesService.addEntry(entry);
        entriesAdded++;
      } catch (err) {
        console.warn('Failed to import entry:', entry.date, err);
        entriesFailed++;
      }
    }
    console.log(`✅ Imported ${entriesAdded} entries (${entriesFailed} failed)`);

    // Import weights if available (backwards compatibility)
    if (data.weights) {
      let weightsAdded = 0;
      let weightsFailed = 0;
      for (const weight of data.weights) {
        try {
          await weightsService.addWeight(weight);
          weightsAdded++;
        } catch (err) {
          console.warn('Failed to import weight:', weight.date, err);
          weightsFailed++;
        }
      }
      console.log(`✅ Imported ${weightsAdded} weights (${weightsFailed} failed)`);
    }

    // Import settings if available (backwards compatibility)
    if (data.settings) {
      // Clean old fields before importing
      const settingsToImport = { ...data.settings } as any;
      delete settingsToImport.caloriesRest;
      delete settingsToImport.caloriesSport;
      delete settingsToImport.proteinRest;
      delete settingsToImport.proteinSport;

      // Migrate if needed
      if ((data.settings as any).caloriesRest !== undefined || (data.settings as any).caloriesSport !== undefined) {
        settingsToImport.calories = settingsToImport.calories ?? ((data.settings as any).caloriesSport || (data.settings as any).caloriesRest);
        settingsToImport.protein = settingsToImport.protein ?? ((data.settings as any).proteinSport || (data.settings as any).proteinRest);
      }

      await settingsService.saveSettings(settingsToImport);
    }

    // Import product portions if available (v1.3+)
    if (data.productPortions) {
      // Clear existing portions
      await portionsService.clearAllPortions();
      let portionsAdded = 0;
      let portionsFailed = 0;
      for (const portion of data.productPortions) {
        try {
          await portionsService.addPortion(portion);
          portionsAdded++;
        } catch (err) {
          console.warn('Failed to import portion:', portion.productName, portion.portionName, err);
          portionsFailed++;
        }
      }
      console.log(`✅ Imported ${portionsAdded} portions (${portionsFailed} failed)`);
    }

    // Import meal templates if available (v1.3+)
    if (data.mealTemplates) {
      // Clear existing templates
      await templatesService.clearAllTemplates();
      let templatesAdded = 0;
      let templatesFailed = 0;
      for (const template of data.mealTemplates) {
        try {
          await templatesService.addTemplate(template);
          templatesAdded++;
        } catch (err) {
          console.warn('Failed to import template:', template.name, err);
          templatesFailed++;
        }
      }
      console.log(`✅ Imported ${templatesAdded} templates (${templatesFailed} failed)`);
    }

    // Import daily activities if available (v1.5+)
    if (data.dailyActivities) {
      // Clear existing activities
      await activitiesService.clearAllActivities();
      let activitiesAdded = 0;
      let activitiesFailed = 0;
      for (const activity of data.dailyActivities) {
        try {
          await activitiesService.addOrUpdateActivity(activity);
          activitiesAdded++;
        } catch (err) {
          console.warn('Failed to import activity:', activity.date, err);
          activitiesFailed++;
        }
      }
      console.log(`✅ Imported ${activitiesAdded} activities (${activitiesFailed} failed)`);
    }
  }

  /**
   * Sync to Google Drive with smart merge
   * Auto-sync: First pull cloud changes (merge), then upload
   * Manual sync with force: Just upload without pulling first
   */
  async syncToCloud(password: string, forceUpload: boolean = false): Promise<void> {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      console.log('⏭️ Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;

    try {
      // Before checking if signed in, try auto-refresh if token expired
      // This prevents popup when browser was idle and token expired
      if (!googleDriveService.isSignedIn()) {
        await googleDriveService.ensureValidToken();
      }

      // Now check again after potential refresh
      if (!googleDriveService.isSignedIn()) {
        throw new Error('Not signed in to Google Drive');
      }

      if (!password) {
        throw new Error('Encryptie wachtwoord is vereist');
      }

      // For auto-sync: first merge any cloud changes before uploading
      if (!forceUpload) {
        try {
          // Try to pull and merge cloud data first
          const cloudData = await this.downloadCloudData(password);
          if (cloudData) {
            await this.mergeData(cloudData);
            console.log('Auto-sync: Merged cloud changes before uploading');
          }
        } catch (err) {
          // If download/merge fails, just continue with upload
          console.warn('Auto-sync: Could not pull cloud data, continuing with upload', err);
        }
      }

    // Cleanup old deleted items before syncing (>14 days)
    await this.cleanupOldDeletedItems();

    // Export current (possibly merged) data
    const data = await this.exportAllData();
    const json = JSON.stringify(data);
    console.log('📤 About to upload data:', {
      entries: data.entries.length,
      products: data.products.length,
      weights: data.weights.length,
      productPortions: data.productPortions?.length || 0,
      mealTemplates: data.mealTemplates?.length || 0,
      dailyActivities: data.dailyActivities?.length || 0,
      heartRateSamples: data.heartRateSamples?.length || 0,
    });

      // Encrypt
      const encrypted = await encryptionService.encrypt(json, password);
      console.log('🔒 Data encrypted, size:', encrypted.length, 'bytes');

      // Upload
      await googleDriveService.uploadData(encrypted);
      console.log('✅ Upload completed successfully');

      // Store last sync time
      localStorage.setItem('last_sync_time', new Date().toISOString());

      // Dispatch event to trigger UI refresh
      window.dispatchEvent(new CustomEvent('data-synced'));
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Download and decrypt cloud data without importing
   */
  private async downloadCloudData(password: string): Promise<SyncData | null> {
    const encrypted = await googleDriveService.downloadData();

    if (!encrypted) {
      return null;
    }

    const decrypted = await encryptionService.decrypt(encrypted, password);
    return JSON.parse(decrypted);
  }

  /**
   * Merge from Google Drive (safer than full restore)
   */
  async mergeFromCloud(password: string): Promise<void> {
    if (!googleDriveService.isSignedIn()) {
      throw new Error('Not signed in to Google Drive');
    }

    if (!password) {
      throw new Error('Encryptie wachtwoord is vereist');
    }

    const cloudData = await this.downloadCloudData(password);

    if (!cloudData) {
      throw new Error('Geen backup gevonden in Google Drive');
    }

    // Merge cloud data with local
    await this.mergeData(cloudData);

    // Store last sync time
    localStorage.setItem('last_sync_time', new Date().toISOString());

    // Dispatch event to trigger UI refresh
    window.dispatchEvent(new CustomEvent('data-synced'));
  }

  /**
   * Restore from Google Drive (DEPRECATED - use mergeFromCloud instead)
   * Full restore that overwrites all local data
   */
  async restoreFromCloud(password: string): Promise<void> {
    if (!googleDriveService.isSignedIn()) {
      throw new Error('Not signed in to Google Drive');
    }

    if (!password) {
      throw new Error('Encryptie wachtwoord is vereist');
    }

    // Download
    const encrypted = await googleDriveService.downloadData();

    if (!encrypted) {
      throw new Error('Geen backup gevonden in Google Drive');
    }

    // Decrypt
    const decrypted = await encryptionService.decrypt(encrypted, password);
    const data: SyncData = JSON.parse(decrypted);

    // Import
    await this.importAllData(data);

    // Store last sync time
    localStorage.setItem('last_sync_time', new Date().toISOString());
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    const stored = localStorage.getItem('last_sync_time');
    return stored ? new Date(stored) : null;
  }

  /**
   * Get stored encryption password (optional - for convenience)
   */
  getStoredPassword(): string | null {
    return localStorage.getItem('sync_password');
  }

  /**
   * Store encryption password (optional - for convenience)
   */
  storePassword(password: string): void {
    localStorage.setItem('sync_password', password);
  }

  /**
   * Clear stored password
   */
  clearStoredPassword(): void {
    localStorage.removeItem('sync_password');
  }
}

export const syncService = new SyncService();
