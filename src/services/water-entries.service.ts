/**
 * Water Entries Service
 *
 * Service voor water intake tracking operaties
 */

import { db } from './database.service';
import type { WaterEntry } from '@/types';
import { generateId, getTimestamp } from '@/utils/date.utils';
import { syncService } from './sync.service';

class WaterEntriesService {
  /**
   * Haal alle water entries op, gesorteerd op timestamp (nieuwste eerst)
   */
  async getAllWaterEntries(): Promise<WaterEntry[]> {
    const all = await db.waterEntries.orderBy('timestamp').reverse().toArray();
    // Filter out soft-deleted items
    return all.filter(e => !e.deleted);
  }

  /**
   * Haal water entries op voor een specifieke datum
   */
  async getEntriesByDate(date: string): Promise<WaterEntry[]> {
    const all = await db.waterEntries
      .where('date')
      .equals(date)
      .toArray();
    // Filter out soft-deleted items and sort by timestamp
    return all
      .filter(e => !e.deleted)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Haal water entries op voor een specifieke datum range
   */
  async getEntriesByDateRange(startDate: string, endDate: string): Promise<WaterEntry[]> {
    const all = await db.waterEntries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
    // Filter out soft-deleted items and sort by timestamp
    return all
      .filter(e => !e.deleted)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Haal een specifiek water entry op
   */
  async getEntryById(id: string): Promise<WaterEntry | undefined> {
    return await db.waterEntries.get(id);
  }

  /**
   * Voeg een nieuw water entry toe
   */
  async addWaterEntry(entry: Omit<WaterEntry, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = generateId();
    const now = getTimestamp();
    const newEntry: WaterEntry = {
      ...entry,
      id,
      created_at: now,
      updated_at: now,
    };

    await db.waterEntries.add(newEntry);
    console.log(`💧 Added water entry: ${entry.amount}ml on ${entry.date}`);

    // Trigger auto-sync (debounced 30s)
    syncService.triggerAutoSync();

    return id;
  }

  /**
   * Update een bestaand water entry
   */
  async updateWaterEntry(id: string, updates: Partial<Omit<WaterEntry, 'id' | 'created_at'>>): Promise<void> {
    await db.waterEntries.update(id, {
      ...updates,
      updated_at: getTimestamp(),
    });

    // Trigger auto-sync (debounced 30s)
    syncService.triggerAutoSync();
  }

  /**
   * Verwijder een water entry (soft delete)
   */
  async deleteWaterEntry(id: string): Promise<void> {
    const now = getTimestamp();
    await db.waterEntries.update(id, {
      deleted: true,
      deleted_at: now,
      updated_at: now, // Important: update timestamp so sync can detect the change
    });

    console.log(`🗑️ Deleted water entry: ${id}`);

    // Trigger auto-sync (debounced 30s)
    syncService.triggerAutoSync();
  }

  /**
   * Bereken totale water intake voor een specifieke datum
   */
  async getTotalWaterByDate(date: string): Promise<number> {
    const entries = await this.getEntriesByDate(date);
    return entries.reduce((total, entry) => total + entry.amount, 0);
  }

  /**
   * Bereken totale water intake voor een datum range
   * Retourneert een object met per datum de totale ml
   */
  async getTotalWaterByDateRange(startDate: string, endDate: string): Promise<Record<string, number>> {
    const entries = await this.getEntriesByDateRange(startDate, endDate);

    const totals: Record<string, number> = {};
    entries.forEach(entry => {
      if (!totals[entry.date]) {
        totals[entry.date] = 0;
      }
      totals[entry.date] += entry.amount;
    });

    return totals;
  }

  /**
   * Haal dagelijkse statistieken op voor een datum range
   */
  async getDailyStats(startDate: string, endDate: string): Promise<{
    totalDays: number;
    daysWithData: number;
    totalWater: number;
    avgWaterPerDay: number;
    maxWaterPerDay: number;
    minWaterPerDay: number;
  }> {
    const totals = await this.getTotalWaterByDateRange(startDate, endDate);
    const amounts = Object.values(totals);

    // Calculate date range in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const daysWithData = amounts.length;
    const totalWater = amounts.reduce((sum, amount) => sum + amount, 0);
    const avgWaterPerDay = daysWithData > 0 ? Math.round(totalWater / daysWithData) : 0;
    const maxWaterPerDay = amounts.length > 0 ? Math.max(...amounts) : 0;
    const minWaterPerDay = amounts.length > 0 ? Math.min(...amounts) : 0;

    return {
      totalDays,
      daysWithData,
      totalWater,
      avgWaterPerDay,
      maxWaterPerDay,
      minWaterPerDay,
    };
  }

  /**
   * Cleanup oude water entries (14-day retention policy)
   * Called periodically to prevent unlimited growth
   */
  async cleanupOldEntries(): Promise<number> {
    const RETENTION_DAYS = 14;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const toDelete = await db.waterEntries
      .where('date')
      .below(cutoffDateStr)
      .filter(e => !e.deleted) // Only soft-delete if not already deleted
      .toArray();

    if (toDelete.length === 0) {
      return 0;
    }

    // Soft delete instead of permanent delete (consistent with cloud sync)
    const now = getTimestamp();
    for (const entry of toDelete) {
      await db.waterEntries.update(entry.id!, {
        deleted: true,
        deleted_at: now,
      });
    }

    console.log(`🗑️ Soft-deleted ${toDelete.length} old water entries (older than ${RETENTION_DAYS} days)`);
    return toDelete.length;
  }

  /**
   * Haal alle water entries op inclusief soft-deleted (voor sync)
   */
  async getAllEntriesIncludingDeleted(): Promise<WaterEntry[]> {
    return await db.waterEntries.toArray();
  }

  /**
   * Bulk import van water entries (voor data import)
   */
  async importWaterEntries(entries: WaterEntry[]): Promise<number> {
    if (entries.length === 0) {
      return 0;
    }

    // Ensure all entries have required fields
    const entriesToAdd: WaterEntry[] = entries.map(e => ({
      ...e,
      id: e.id || generateId(),
      created_at: e.created_at || getTimestamp(),
      updated_at: e.updated_at || getTimestamp(),
    }));

    await db.waterEntries.bulkPut(entriesToAdd);
    console.log(`✅ Bulk imported ${entriesToAdd.length} water entries`);

    // Trigger auto-sync
    syncService.triggerAutoSync();

    return entriesToAdd.length;
  }

  /**
   * Verwijder alle water entries (voor testing/reset)
   */
  async clearAllEntries(): Promise<number> {
    const count = await db.waterEntries.count();
    await db.waterEntries.clear();
    console.log(`🗑️ Cleared all ${count} water entries`);
    return count;
  }
}

// Singleton instance
export const waterEntriesService = new WaterEntriesService();
export default waterEntriesService;
