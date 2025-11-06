/**
 * PortionsService
 *
 * CRUD operaties voor product portions (portie templates)
 */

import { db } from './database.service';
import type { ProductPortion } from '@/types';
import { getTimestamp, generateId } from '@/utils';
import { ALL_DEFAULT_PORTIONS } from '@/data/defaultPortions';

class PortionsService {
  private initialized = false;

  /**
   * Initialize default portions (one-time)
   */
  async initializeDefaults(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check count right before adding to avoid race condition with sync
      const existingPortions = await db.productPortions.count();

      // Only add defaults if database is still empty
      if (existingPortions === 0) {
        const now = getTimestamp();
        const portionsWithTimestamps = ALL_DEFAULT_PORTIONS.map(portion => ({
          ...portion,
          id: generateId(),
          created_at: now,
          updated_at: now,
        }));

        // Double-check right before bulkAdd (sync might have run in between)
        const finalCount = await db.productPortions.count();
        if (finalCount === 0) {
          await db.productPortions.bulkAdd(portionsWithTimestamps);
          console.log(`✅ Initialized ${portionsWithTimestamps.length} default portions`);
        } else {
          console.log(`ℹ️ Skipping default portions init - ${finalCount} portions already exist (likely from sync)`);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Error initializing default portions:', error);
    }
  }

  /**
   * Laad alle portions
   */
  async getAllPortions(): Promise<ProductPortion[]> {
    try {
      return await db.productPortions
        .filter(p => !p.deleted)
        .toArray();
    } catch (error) {
      console.error('❌ Error loading portions:', error);
      return [];
    }
  }

  /**
   * Laad portions voor specifiek product
   */
  async getPortionsByProduct(productName: string): Promise<ProductPortion[]> {
    try {
      return await db.productPortions
        .where('productName')
        .equals(productName)
        .filter(p => !p.deleted)
        .sortBy('isDefault')
        .then(portions => portions.reverse()); // Default eerst
    } catch (error) {
      console.error('❌ Error loading portions for product:', error);
      return [];
    }
  }

  /**
   * Voeg nieuwe portion toe
   */
  async addPortion(portion: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>): Promise<ProductPortion> {
    try {
      const now = getTimestamp();
      const newPortion: ProductPortion = {
        ...portion,
        id: generateId(),
        created_at: now,
        updated_at: now,
      };

      await db.productPortions.add(newPortion);
      console.log('✅ Portion added:', newPortion.portionName);
      return newPortion;
    } catch (error) {
      console.error('❌ Error adding portion:', error);
      throw error;
    }
  }

  /**
   * Update bestaande portion
   */
  async updatePortion(id: number | string, updates: Partial<ProductPortion>): Promise<void> {
    try {
      const now = getTimestamp();
      await db.productPortions.update(id, {
        ...updates,
        updated_at: now,
      });
      console.log('✅ Portion updated:', id);
    } catch (error) {
      console.error('❌ Error updating portion:', error);
      throw error;
    }
  }

  /**
   * Verwijder portion (soft delete)
   */
  async deletePortion(id: number | string): Promise<void> {
    try {
      await db.productPortions.update(id, {
        deleted: true,
        deleted_at: getTimestamp(),
        updated_at: getTimestamp(),
      });
      console.log('✅ Portion soft deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting portion:', error);
      throw error;
    }
  }

  /**
   * Set default portion voor een product (unset andere defaults)
   */
  async setDefaultPortion(productName: string, portionId: number | string): Promise<void> {
    try {
      const now = getTimestamp();

      // Unset all defaults for this product
      const portions = await db.productPortions
        .where('productName')
        .equals(productName)
        .toArray();

      for (const portion of portions) {
        if (portion.id !== portionId && portion.isDefault) {
          await db.productPortions.update(portion.id!, {
            isDefault: false,
            updated_at: now,
          });
        }
      }

      // Set new default
      await db.productPortions.update(portionId, {
        isDefault: true,
        updated_at: now,
      });

      console.log('✅ Default portion set for:', productName);
    } catch (error) {
      console.error('❌ Error setting default portion:', error);
      throw error;
    }
  }

  /**
   * Bulk add portions (voor import)
   */
  async bulkAddPortions(portions: ProductPortion[]): Promise<number> {
    try {
      const existingPortions = await db.productPortions.toArray();

      // Maak een Set van unieke keys (productName + portionName)
      const existingKeys = new Set(
        existingPortions.map(p => `${p.productName}|${p.portionName}`)
      );

      // Filter alleen nieuwe portions (geen duplicaten)
      const newPortions = portions.filter(portion => {
        const key = `${portion.productName}|${portion.portionName}`;
        return !existingKeys.has(key);
      });

      if (newPortions.length > 0) {
        await db.productPortions.bulkPut(newPortions);
        console.log(`✅ Bulk added ${newPortions.length} new portions`);
      }

      return newPortions.length;
    } catch (error) {
      console.error('❌ Error bulk adding portions:', error);
      throw error;
    }
  }

  /**
   * Clear alle portions (voorzichtig!)
   */
  async clearAllPortions(): Promise<number> {
    try {
      const count = await db.productPortions.count();
      await db.productPortions.clear();
      console.log(`✅ ${count} portions cleared`);
      return count;
    } catch (error) {
      console.error('❌ Error clearing portions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const portionsService = new PortionsService();
export default portionsService;
