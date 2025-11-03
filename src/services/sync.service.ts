/**
 * Sync Service - Combines encryption + Google Drive
 */

import { encryptionService } from './encryption.service';
import { googleDriveService } from './googledrive.service';
import { entriesService } from './entries.service';
import { productsService } from './products.service';
import { weightsService } from './weights.service';
import { settingsService } from './settings.service';
import type { Entry, Product, Weight, UserSettings } from '@/types';

export interface SyncData {
  version: string;
  timestamp: string;
  entries: Entry[];
  products: Product[];
  weights: Weight[];
  settings: UserSettings;
}

class SyncService {
  private autoSyncEnabled: boolean = false;
  private autoSyncInterval: number | null = null;
  private syncDebounceTimeout: number | null = null;

  /**
   * Enable auto-sync (will check for updates every 5 minutes)
   */
  enableAutoSync(password: string): void {
    this.autoSyncEnabled = true;
    this.storePassword(password);

    // Check for updates every 5 minutes
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    this.autoSyncInterval = window.setInterval(async () => {
      try {
        await this.pullIfNewer(password);
      } catch (error) {
        console.error('Auto-sync pull failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Disable auto-sync
   */
  disableAutoSync(): void {
    this.autoSyncEnabled = false;
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
   * Export all data for sync
   */
  async exportAllData(): Promise<SyncData> {
    const entries = await entriesService.getAllEntries();
    const products = await productsService.getAllProducts();
    const weights = await weightsService.getAllWeights();
    const settings = await settingsService.getSettings();

    return {
      version: '1.1', // Updated version for new format
      timestamp: new Date().toISOString(),
      entries,
      products,
      weights,
      settings,
    };
  }

  /**
   * Merge cloud data with local data (smart merge - keeps newest of each item)
   */
  async mergeData(cloudData: SyncData): Promise<void> {
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
        // Cloud entry is newer
        await entriesService.updateEntry(localEntry.id!, cloudEntry);
      }
    }

    // Merge products - add cloud products that don't exist locally
    for (const cloudProduct of cloudData.products) {
      const localProduct = localProductsMap.get(cloudProduct.name);

      if (!localProduct) {
        // New product from cloud
        await productsService.addProduct(cloudProduct);
      }
      // Note: We don't update existing products to preserve local customizations
    }

    // Merge weights - add cloud weights that don't exist locally or are newer
    if (cloudData.weights) {
      for (const cloudWeight of cloudData.weights) {
        const localWeight = localWeightsMap.get(cloudWeight.date);

        if (!localWeight) {
          // New weight from cloud
          await weightsService.addWeight(cloudWeight);
        } else if (cloudWeight.created_at && localWeight.created_at &&
                   new Date(cloudWeight.created_at) > new Date(localWeight.created_at)) {
          // Cloud weight is newer (updated later in the day)
          await weightsService.updateWeight(localWeight.id!, cloudWeight);
        }
      }
    }

    // Merge settings - always take the newest timestamp
    if (cloudData.settings) {
      const localSettings = await settingsService.getSettings();

      // Settings don't have timestamps in current implementation, so we just update
      // You could add a timestamp field to settings for proper conflict resolution
      await settingsService.saveSettings(cloudData.settings);
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
    for (const product of data.products) {
      await productsService.addProduct(product);
    }

    for (const entry of data.entries) {
      await entriesService.addEntry(entry);
    }

    // Import weights if available (backwards compatibility)
    if (data.weights) {
      for (const weight of data.weights) {
        await weightsService.addWeight(weight);
      }
    }

    // Import settings if available (backwards compatibility)
    if (data.settings) {
      await settingsService.saveSettings(data.settings);
    }
  }

  /**
   * Sync to Google Drive with smart merge
   * Auto-sync: First pull cloud changes (merge), then upload
   * Manual sync with force: Just upload without pulling first
   */
  async syncToCloud(password: string, forceUpload: boolean = false): Promise<void> {
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

    // Export current (possibly merged) data
    const data = await this.exportAllData();
    const json = JSON.stringify(data);

    // Encrypt
    const encrypted = await encryptionService.encrypt(json, password);

    // Upload
    await googleDriveService.uploadData(encrypted);

    // Store last sync time
    localStorage.setItem('last_sync_time', new Date().toISOString());
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
   * Restore from Google Drive
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
