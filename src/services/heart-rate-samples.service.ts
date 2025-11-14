/**
 * Heart Rate Samples Service
 *
 * Manages intraday heart rate data storage and retrieval
 * Stores ~680 HR measurements per day (every ~2 minutes)
 */

import { db } from './database.service';
import type { DayHeartRateSamples, HeartRateSample } from '@/types';

class HeartRateSamplesService {
  /**
   * Add or update heart rate samples for a specific date
   */
  async addOrUpdateSamples(date: string, samples: HeartRateSample[]): Promise<void> {
    try {
      console.log(`💓 Attempting to store HR samples for ${date}, count: ${samples.length}`);

      // Validate and filter samples with strict type checking
      const validSamples = samples.filter(s => {
        // Check if sample is a valid object
        if (!s || typeof s !== 'object') {
          console.warn(`Invalid sample object:`, s);
          return false;
        }

        // Check if timestamp and bpm are valid numbers
        if (typeof s.timestamp !== 'number' || isNaN(s.timestamp) || !isFinite(s.timestamp)) {
          console.warn(`Invalid timestamp in sample:`, s);
          return false;
        }
        if (typeof s.bpm !== 'number' || isNaN(s.bpm) || !isFinite(s.bpm)) {
          console.warn(`Invalid BPM in sample:`, s);
          return false;
        }
        // Check if BPM is in reasonable range (20-250)
        if (s.bpm < 20 || s.bpm > 250) {
          console.warn(`BPM out of range (${s.bpm}):`, s);
          return false;
        }
        return true;
      });

      if (validSamples.length === 0) {
        console.warn(`No valid HR samples for ${date}, skipping`);
        return;
      }

      const now = new Date().toISOString();

      // Calculate summary statistics
      const bpms = validSamples.map(s => s.bpm);
      const minBpm = Math.min(...bpms);
      const maxBpm = Math.max(...bpms);
      const avgBpm = Math.round(bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length);

      // Create the record (using date as primary key)
      const record: DayHeartRateSamples = {
        date,
        samples: validSamples.map(s => ({
          timestamp: Number(s.timestamp),
          bpm: Number(s.bpm)
        })),
        sampleCount: validSamples.length,
        minBpm,
        maxBpm,
        avgBpm,
        created_at: now,
        updated_at: now,
      };

      // Use put() which inserts or updates based on primary key (date)
      console.log(`💾 Saving record to DB:`, { date, sampleCount: validSamples.length, minBpm, maxBpm, avgBpm });
      await db.heartRateSamples.put(record);
      console.log(`✅ Stored ${validSamples.length} HR samples for ${date} (${minBpm}-${maxBpm} bpm, avg ${avgBpm})`);

    } catch (error: any) {
      console.error(`❌ Failed to store HR samples for ${date}:`, error);
      console.error(`❌ Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get heart rate samples for a specific date
   */
  async getSamplesByDate(date: string): Promise<DayHeartRateSamples | undefined> {
    return await db.heartRateSamples.get(date);
  }

  /**
   * Get heart rate samples for a date range
   */
  async getSamplesByDateRange(startDate: string, endDate: string): Promise<DayHeartRateSamples[]> {
    return await db.heartRateSamples
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  /**
   * Get all heart rate samples
   */
  async getAllSamples(): Promise<DayHeartRateSamples[]> {
    return await db.heartRateSamples
      .where('deleted')
      .notEqual(true)
      .toArray();
  }

  /**
   * Get sample count summary (how many days have HR data)
   */
  async getSampleCountSummary(): Promise<{
    totalDays: number;
    totalSamples: number;
    avgSamplesPerDay: number;
  }> {
    const all = await this.getAllSamples();
    const totalDays = all.length;
    const totalSamples = all.reduce((sum, day) => sum + (day.sampleCount || 0), 0);
    const avgSamplesPerDay = totalDays > 0 ? Math.round(totalSamples / totalDays) : 0;

    return {
      totalDays,
      totalSamples,
      avgSamplesPerDay,
    };
  }

  /**
   * Delete heart rate samples for a specific date
   */
  async deleteSamplesByDate(date: string): Promise<boolean> {
    const existing = await this.getSamplesByDate(date);
    if (!existing) return false;

    await db.heartRateSamples.update(date, {
      deleted: true,
      deleted_at: new Date().toISOString(),
    });

    console.log(`🗑️ Deleted HR samples for ${date}`);
    return true;
  }

  /**
   * Permanently delete old samples (for retention policy)
   * Deletes samples older than the specified number of days
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const toDelete = await db.heartRateSamples
      .where('date')
      .below(cutoffDateStr)
      .toArray();

    if (toDelete.length === 0) {
      return 0;
    }

    await db.heartRateSamples.bulkDelete(toDelete.map(d => d.date));

    console.log(`🗑️ Deleted ${toDelete.length} old HR sample days (older than ${days} days)`);
    return toDelete.length;
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

    // Estimate: 10 bytes per sample (timestamp + bpm)
    const estimatedBytes = summary.totalSamples * 10;
    const estimatedKB = Math.round(estimatedBytes / 1024);

    return {
      ...summary,
      estimatedKB,
    };
  }

  /**
   * Clear all heart rate samples (for testing/debugging)
   */
  async clearAllSamples(): Promise<number> {
    const count = await db.heartRateSamples.count();
    await db.heartRateSamples.clear();
    console.log(`🗑️ Cleared all ${count} HR sample days`);
    return count;
  }
}

export const heartRateSamplesService = new HeartRateSamplesService();
export default heartRateSamplesService;
