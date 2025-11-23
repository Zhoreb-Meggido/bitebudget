/**
 * Steps Samples Service
 *
 * Manages intraday steps data storage and retrieval
 * Stores step count measurements throughout the day
 */

import { db } from './database.service';
import type { DayStepsSamples, StepsSample } from '@/types';

class StepsSamplesService {
  /**
   * Add or update steps samples for a specific date
   */
  async addOrUpdateSamples(date: string, samples: StepsSample[]): Promise<void> {
    try {
      console.log(`👣 Attempting to store steps samples for ${date}, count: ${samples.length}`);

      // Validate and filter samples with strict type checking
      const validSamples = samples.filter(s => {
        // Check if sample is a valid object
        if (!s || typeof s !== 'object') {
          console.warn(`Invalid sample object:`, s);
          return false;
        }

        // Check if timestamp and count are valid numbers
        if (typeof s.timestamp !== 'number' || isNaN(s.timestamp) || !isFinite(s.timestamp)) {
          console.warn(`Invalid timestamp in sample:`, s);
          return false;
        }
        if (typeof s.count !== 'number' || isNaN(s.count) || !isFinite(s.count)) {
          console.warn(`Invalid count in sample:`, s);
          return false;
        }
        // Check if count is non-negative
        if (s.count < 0) {
          console.warn(`Negative step count (${s.count}):`, s);
          return false;
        }
        return true;
      });

      if (validSamples.length === 0) {
        console.warn(`No valid steps samples for ${date}, skipping`);
        return;
      }

      const now = new Date().toISOString();

      // Calculate summary statistics
      const counts = validSamples.map(s => s.count);
      const totalSteps = counts.reduce((sum, count) => sum + count, 0);
      const maxSteps = Math.max(...counts);

      // Create the record (using date as primary key)
      const record: DayStepsSamples = {
        date,
        samples: validSamples.map(s => ({
          timestamp: Number(s.timestamp),
          count: Number(s.count)
        })),
        sampleCount: validSamples.length,
        totalSteps,
        maxSteps,
        created_at: now,
        updated_at: now,
      };

      // Use put() which inserts or updates based on primary key (date)
      console.log(`💾 Saving record to DB:`, { date, sampleCount: validSamples.length, totalSteps, maxSteps });
      await db.stepsSamples.put(record);
      console.log(`✅ Stored ${validSamples.length} steps samples for ${date} (${totalSteps} total steps, max ${maxSteps})`);

    } catch (error: any) {
      console.error(`❌ Failed to store steps samples for ${date}:`, error);
      console.error(`❌ Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get steps samples for a specific date
   */
  async getSamplesByDate(date: string): Promise<DayStepsSamples | undefined> {
    return await db.stepsSamples.get(date);
  }

  /**
   * Get steps samples for a date range
   */
  async getSamplesByDateRange(startDate: string, endDate: string): Promise<DayStepsSamples[]> {
    return await db.stepsSamples
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  /**
   * Get all steps samples
   */
  async getAllSamples(): Promise<DayStepsSamples[]> {
    const all = await db.stepsSamples.toArray();
    // Filter out soft-deleted items in memory (deleted field is not indexed)
    return all.filter(s => !s.deleted);
  }

  /**
   * Get all steps samples including soft-deleted ones (for sync)
   */
  async getAllSamplesIncludingDeleted(): Promise<DayStepsSamples[]> {
    return await db.stepsSamples.toArray();
  }

  /**
   * Get sample count summary (how many days have steps data)
   */
  async getSampleCountSummary(): Promise<{
    totalDays: number;
    totalSamples: number;
    avgSamplesPerDay: number;
    totalSteps: number;
  }> {
    const all = await this.getAllSamples();
    const totalDays = all.length;
    const totalSamples = all.reduce((sum, day) => sum + (day.sampleCount || 0), 0);
    const totalSteps = all.reduce((sum, day) => sum + (day.totalSteps || 0), 0);
    const avgSamplesPerDay = totalDays > 0 ? Math.round(totalSamples / totalDays) : 0;

    return {
      totalDays,
      totalSamples,
      avgSamplesPerDay,
      totalSteps,
    };
  }

  /**
   * Delete steps samples for a specific date
   */
  async deleteSamplesByDate(date: string): Promise<boolean> {
    const existing = await this.getSamplesByDate(date);
    if (!existing) return false;

    await db.stepsSamples.update(date, {
      deleted: true,
      deleted_at: new Date().toISOString(),
    });

    console.log(`🗑️ Deleted steps samples for ${date}`);
    return true;
  }

  /**
   * Soft-delete old samples (for retention policy)
   * Marks samples older than the specified number of days as deleted
   * Actual permanent deletion happens via sync service cleanup (>14 days soft-deleted)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const toDelete = await db.stepsSamples
      .where('date')
      .below(cutoffDateStr)
      .filter(s => !s.deleted) // Only soft-delete if not already deleted
      .toArray();

    if (toDelete.length === 0) {
      return 0;
    }

    // Soft delete instead of permanent delete (consistent with cloud sync)
    const now = new Date().toISOString();
    for (const sample of toDelete) {
      await db.stepsSamples.update(sample.date, {
        deleted: true,
        deleted_at: now,
      });
    }

    console.log(`🗑️ Soft-deleted ${toDelete.length} old steps sample days (older than ${days} days)`);
    return toDelete.length;
  }

  /**
   * Cleanup old steps samples (75-day retention policy)
   * Called after Health Connect import to prevent unlimited growth
   */
  async cleanupOldSamples(): Promise<number> {
    const RETENTION_DAYS = 75; // Enough for 56-day heatmap + buffer
    return await this.deleteOlderThan(RETENTION_DAYS);
  }

  /**
   * Get storage size estimate (for monitoring)
   */
  async getStorageSizeEstimate(): Promise<{
    totalDays: number;
    totalSamples: number;
    estimatedKB: number;
  }> {
    const summary = await this.getSampleCountSummary();

    // Estimate: 10 bytes per sample (timestamp + count)
    const estimatedBytes = summary.totalSamples * 10;
    const estimatedKB = Math.round(estimatedBytes / 1024);

    return {
      totalDays: summary.totalDays,
      totalSamples: summary.totalSamples,
      estimatedKB,
    };
  }

  /**
   * Clear all steps samples (for testing/debugging)
   */
  async clearAllSamples(): Promise<number> {
    const count = await db.stepsSamples.count();
    await db.stepsSamples.clear();
    console.log(`🗑️ Cleared all ${count} steps sample days`);
    return count;
  }
}

export const stepsSamplesService = new StepsSamplesService();
export default stepsSamplesService;
