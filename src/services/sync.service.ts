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
import { db } from './database.service';
import type { Entry, Product, Weight, UserSettings, ProductPortion, MealTemplate } from '@/types';

export interface SyncData {
  version: string;
  timestamp: string;
  entries: Entry[];
  products: Product[];
  weights: Weight[];
  settings: UserSettings;
  productPortions?: ProductPortion[];  // v1.3+
  mealTemplates?: MealTemplate[];      // v1.3+
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

    // Check for updates every 5 minutes
    this.autoSyncInterval = window.setInterval(async () => {
      try {
        await this.pullIfNewer(password);
      } catch (error) {
        console.error('Auto-sync pull failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Enable auto-sync (will check for updates every 5 minutes)
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
      const entries = await entriesService.getAllEntries();
      const oldDeletedEntries = entries.filter(
        e => e.deleted && e.deleted_at && e.deleted_at < cutoffDate
      );
      for (const entry of oldDeletedEntries) {
        if (entry.id) {
          await db.entries.delete(entry.id);
        }
      }
      if (oldDeletedEntries.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedEntries.length} old deleted entries`);
      }

      // Cleanup products
      const products = await productsService.getAllProducts();
      const oldDeletedProducts = products.filter(
        p => p.deleted && p.deleted_at && p.deleted_at < cutoffDate
      );
      for (const product of oldDeletedProducts) {
        if (product.id) {
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
        if (weight.id) {
          await db.weights.delete(weight.id);
        }
      }
      if (oldDeletedWeights.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedWeights.length} old deleted weights`);
      }

      // Cleanup product portions
      const portions = await portionsService.getAllPortions();
      const oldDeletedPortions = portions.filter(
        p => p.deleted && p.deleted_at && p.deleted_at < cutoffDate
      );
      for (const portion of oldDeletedPortions) {
        if (portion.id) {
          await db.productPortions.delete(portion.id);
        }
      }
      if (oldDeletedPortions.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedPortions.length} old deleted portions`);
      }

      // Cleanup meal templates
      const templates = await templatesService.getAllTemplates();
      const oldDeletedTemplates = templates.filter(
        t => t.deleted && t.deleted_at && t.deleted_at < cutoffDate
      );
      for (const template of oldDeletedTemplates) {
        if (template.id) {
          await db.mealTemplates.delete(template.id);
        }
      }
      if (oldDeletedTemplates.length > 0) {
        console.log(`🗑️ Cleaned up ${oldDeletedTemplates.length} old deleted templates`);
      }
    } catch (error) {
      console.error('❌ Error during cleanup of old deleted items:', error);
    }
  }

  /**
   * Export all data for sync
   */
  async exportAllData(): Promise<SyncData> {
    const entries = await entriesService.getAllEntries();
    const products = await productsService.getAllProducts();
    const weights = await weightsService.getAllWeights();
    const settings = await settingsService.loadSettings();
    const productPortions = await portionsService.getAllPortions();
    const mealTemplates = await templatesService.getAllTemplates();

    console.log('📤 Preparing export with:', {
      entries: entries.length,
      products: products.length,
      weights: weights.length,
      productPortions: productPortions.length,
      mealTemplates: mealTemplates.length,
    });

    return {
      version: '1.3', // Updated version for portions & templates support
      timestamp: new Date().toISOString(),
      entries,
      products,
      weights,
      settings,
      productPortions,
      mealTemplates,
    };
  }

  /**
   * Merge cloud data with local data (smart merge - keeps newest of each item)
   */
  async mergeData(cloudData: SyncData): Promise<void> {
    console.log('📥 Merging cloud data version:', cloudData.version);
    console.log('📊 Cloud data contains:', {
      entries: cloudData.entries?.length || 0,
      products: cloudData.products?.length || 0,
      weights: cloudData.weights?.length || 0,
      productPortions: cloudData.productPortions?.length || 0,
      mealTemplates: cloudData.mealTemplates?.length || 0,
    });

    // Get existing local data
    const localEntries = await entriesService.getAllEntries();
    const localProducts = await productsService.getAllProducts();
    const localWeights = await weightsService.getAllWeights();

    // Create maps for faster lookup (using composite keys for entries/weights)
    const localEntriesMap = new Map(localEntries.map(e => [`${e.date}-${e.time}-${e.name}`, e]));
    const localProductsMap = new Map(localProducts.map(p => [p.name, p]));
    const localWeightsMap = new Map(localWeights.map(w => [w.date, w]));

    // Merge entries - add cloud entries that don't exist locally or are newer
    for (const cloudEntry of cloudData.entries) {
      const key = `${cloudEntry.date}-${cloudEntry.time}-${cloudEntry.name}`;
      const localEntry = localEntriesMap.get(key);

      if (!localEntry) {
        // New entry from cloud
        await entriesService.addEntry(cloudEntry);
      } else if (cloudEntry.updated_at && localEntry.updated_at &&
                 new Date(cloudEntry.updated_at) > new Date(localEntry.updated_at)) {
        // Cloud entry is newer - propagate all changes including deletion
        await entriesService.updateEntry(localEntry.id!, cloudEntry);
      }
    }

    // Merge products - add cloud products that don't exist locally or are newer
    for (const cloudProduct of cloudData.products) {
      const localProduct = localProductsMap.get(cloudProduct.name);

      if (!localProduct) {
        // New product from cloud
        await productsService.addProduct(cloudProduct);
      } else if (cloudProduct.updated_at && localProduct.updated_at &&
                 new Date(cloudProduct.updated_at) > new Date(localProduct.updated_at)) {
        // Cloud product is newer - propagate all changes including deletion
        await productsService.updateProduct(localProduct.id!, cloudProduct);
      }
    }

    // Merge weights - add cloud weights that don't exist locally or are newer
    if (cloudData.weights) {
      for (const cloudWeight of cloudData.weights) {
        const localWeight = localWeightsMap.get(cloudWeight.date);

        if (!localWeight) {
          // New weight from cloud
          await weightsService.addWeight(cloudWeight);
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
            await weightsService.updateWeight(localWeight.id!, cloudWeight);
          }
        }
      }
    }

    // Merge settings - always take the newest timestamp
    if (cloudData.settings) {
      const localSettings = await settingsService.loadSettings();

      // Settings don't have timestamps in current implementation, so we just update
      // You could add a timestamp field to settings for proper conflict resolution
      await settingsService.saveSettings(cloudData.settings);
    }

    // Merge product portions - add cloud portions that don't exist locally or are newer
    if (cloudData.productPortions && cloudData.productPortions.length > 0) {
      console.log(`📦 Merging ${cloudData.productPortions.length} portions from cloud...`);
      const localPortions = await portionsService.getAllPortions();
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
            await db.productPortions.update(localPortion.id!, cloudData);
            updatedCount++;
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
      const localTemplates = await templatesService.getAllTemplates();
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
            await db.mealTemplates.update(localTemplate.id!, cloudData);
            updatedCount++;
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
      await settingsService.saveSettings(data.settings);
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
    });

      // Encrypt
      const encrypted = await encryptionService.encrypt(json, password);
      console.log('🔒 Data encrypted, size:', encrypted.length, 'bytes');

      // Upload
      await googleDriveService.uploadData(encrypted);
      console.log('✅ Upload completed successfully');

      // Store last sync time
      localStorage.setItem('last_sync_time', new Date().toISOString());
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
