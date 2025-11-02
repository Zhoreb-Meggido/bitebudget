/**
 * Sync Service - Combines encryption + Google Drive
 */

import { encryptionService } from './encryption.service';
import { googleDriveService } from './googledrive.service';
import { entriesService } from './entries.service';
import { productsService } from './products.service';
import type { Entry, Product } from '@/types';

export interface SyncData {
  version: string;
  timestamp: string;
  entries: Entry[];
  products: Product[];
}

class SyncService {
  /**
   * Export all data for sync
   */
  async exportAllData(): Promise<SyncData> {
    const entries = await entriesService.getAllEntries();
    const products = await productsService.getAllProducts();

    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      entries,
      products,
    };
  }

  /**
   * Import all data from sync
   */
  async importAllData(data: SyncData): Promise<void> {
    // Clear existing data
    const existingEntries = await entriesService.getAllEntries();
    const existingProducts = await productsService.getAllProducts();

    for (const entry of existingEntries) {
      if (entry.id) await entriesService.deleteEntry(entry.id);
    }

    for (const product of existingProducts) {
      if (product.id) await productsService.deleteProduct(product.id);
    }

    // Import new data
    for (const product of data.products) {
      await productsService.addProduct(product);
    }

    for (const entry of data.entries) {
      await entriesService.addEntry(entry);
    }
  }

  /**
   * Sync to Google Drive
   */
  async syncToCloud(password: string): Promise<void> {
    if (!googleDriveService.isSignedIn()) {
      throw new Error('Not signed in to Google Drive');
    }

    if (!password) {
      throw new Error('Encryptie wachtwoord is vereist');
    }

    // Export data
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
