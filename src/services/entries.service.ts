/**
 * EntriesService
 *
 * CRUD operaties voor meal entries
 */

import { db } from './database.service';
import type { Entry } from '@/types';
import { getTimestamp, generateId } from '@/utils';

class EntriesService {
  /**
   * Laad alle entries (exclusief soft-deleted items)
   */
  async getAllEntries(): Promise<Entry[]> {
    try {
      const entries = await db.entries.toArray();
      return entries.filter(e => e.deleted !== true);
    } catch (error) {
      console.error('❌ Error loading entries:', error);
      return [];
    }
  }

  /**
   * Laad alle entries inclusief soft-deleted items (voor sync/export)
   */
  async getAllEntriesIncludingDeleted(): Promise<Entry[]> {
    try {
      return await db.entries.toArray();
    } catch (error) {
      console.error('❌ Error loading entries including deleted:', error);
      return [];
    }
  }

  /**
   * Laad entries voor specifieke datum (exclusief soft-deleted items)
   */
  async getEntriesByDate(date: string): Promise<Entry[]> {
    try {
      const entries = await db.entries.where('date').equals(date).toArray();
      return entries.filter(e => e.deleted !== true);
    } catch (error) {
      console.error('❌ Error loading entries for date:', error);
      return [];
    }
  }

  /**
   * Laad entries voor datum range (exclusief soft-deleted items)
   */
  async getEntriesByDateRange(startDate: string, endDate: string): Promise<Entry[]> {
    try {
      const entries = await db.entries
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray();
      return entries.filter(e => e.deleted !== true);
    } catch (error) {
      console.error('❌ Error loading entries for date range:', error);
      return [];
    }
  }

  /**
   * Voeg nieuwe entry toe
   */
  async addEntry(entry: Omit<Entry, 'id' | 'created_at' | 'updated_at'>): Promise<Entry> {
    try {
      const now = getTimestamp();
      const newEntry: Entry = {
        ...entry,
        id: generateId(),
        created_at: now,
        updated_at: now,
      };

      await db.entries.add(newEntry);
      console.log('✅ Entry added:', newEntry.name);
      return newEntry;
    } catch (error) {
      console.error('❌ Error adding entry:', error);
      throw error;
    }
  }

  /**
   * Update bestaande entry
   */
  async updateEntry(id: number | string, updates: Partial<Entry>): Promise<void> {
    try {
      const now = getTimestamp();
      await db.entries.update(id, {
        ...updates,
        updated_at: now,
      });
      console.log('✅ Entry updated:', id);
    } catch (error) {
      console.error('❌ Error updating entry:', error);
      throw error;
    }
  }

  /**
   * Verwijder entry (soft delete)
   */
  async deleteEntry(id: number | string): Promise<void> {
    try {
      await db.entries.update(id, {
        deleted: true,
        deleted_at: getTimestamp(),
        updated_at: getTimestamp(),
      });
      console.log('✅ Entry soft deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting entry:', error);
      throw error;
    }
  }

  /**
   * Bulk add entries (voor import) - met duplicaat detectie
   * Returns aantal daadwerkelijk toegevoegde entries
   */
  async bulkAddEntries(entries: Entry[]): Promise<number> {
    try {
      // Haal alle bestaande entries op
      const existingEntries = await db.entries.toArray();

      // Maak een Set van unieke keys (datum + tijd + naam + calories)
      const existingKeys = new Set(
        existingEntries.map(e => `${e.date}|${e.time}|${e.name}|${e.calories}`)
      );

      // Filter alleen nieuwe entries (geen duplicaten)
      const newEntries = entries.filter(entry => {
        const key = `${entry.date}|${entry.time}|${entry.name}|${entry.calories}`;
        return !existingKeys.has(key);
      });

      if (newEntries.length > 0) {
        await db.entries.bulkPut(newEntries);
        console.log(`✅ Bulk added ${newEntries.length} new entries (${entries.length - newEntries.length} duplicates skipped)`);
      } else {
        console.log(`ℹ️ No new entries to add (all ${entries.length} were duplicates)`);
      }

      return newEntries.length;
    } catch (error) {
      console.error('❌ Error bulk adding entries:', error);
      throw error;
    }
  }

  /**
   * Clear alle entries (voorzichtig!)
   */
  async clearAllEntries(): Promise<number> {
    try {
      const count = await db.entries.count();
      await db.entries.clear();
      console.log(`✅ ${count} entries cleared`);
      return count;
    } catch (error) {
      console.error('❌ Error clearing entries:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const entriesService = new EntriesService();
export default entriesService;
