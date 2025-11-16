/**
 * Sleep Stages Service
 *
 * Manages intraday sleep stage data storage and retrieval
 * Stores detailed sleep phases: light, deep, REM, awake
 */

import { db } from './database.service';
import type { DaySleepStages, SleepStage, SleepStageType } from '@/types';

class SleepStagesService {
  /**
   * Add or update sleep stages for a specific date
   */
  async addOrUpdateStages(date: string, stages: SleepStage[], sleepStart: number, sleepEnd: number): Promise<void> {
    try {
      console.log(`😴 Attempting to store sleep stages for ${date}, count: ${stages.length}`);

      // Validate and filter stages
      const validStages = stages.filter(s => {
        if (!s || typeof s !== 'object') {
          console.warn(`Invalid stage object:`, s);
          return false;
        }
        if (typeof s.startTime !== 'number' || isNaN(s.startTime) || !isFinite(s.startTime)) {
          console.warn(`Invalid startTime in stage:`, s);
          return false;
        }
        if (typeof s.endTime !== 'number' || isNaN(s.endTime) || !isFinite(s.endTime)) {
          console.warn(`Invalid endTime in stage:`, s);
          return false;
        }
        if (typeof s.stage !== 'number' || s.stage < 1 || s.stage > 8) {
          console.warn(`Invalid stage type (${s.stage}):`, s);
          return false;
        }
        if (s.endTime <= s.startTime) {
          console.warn(`endTime must be after startTime:`, s);
          return false;
        }
        return true;
      });

      if (validStages.length === 0) {
        console.warn(`No valid sleep stages for ${date}, skipping`);
        return;
      }

      const now = new Date().toISOString();

      // Calculate duration breakdown by stage type
      let lightSleepMs = 0;
      let deepSleepMs = 0;
      let remSleepMs = 0;
      let awakeSleepMs = 0;

      validStages.forEach(stage => {
        const durationMs = stage.endTime - stage.startTime;

        switch (stage.stage as SleepStageType) {
          case 4: // LIGHT
            lightSleepMs += durationMs;
            break;
          case 5: // DEEP
            deepSleepMs += durationMs;
            break;
          case 6: // REM
            remSleepMs += durationMs;
            break;
          case 1: // AWAKE
          case 7: // AWAKE_IN_BED
            awakeSleepMs += durationMs;
            break;
          // 2 (SLEEPING), 3 (OUT_OF_BED), 8 (UNKNOWN) don't count towards specific categories
        }
      });

      const totalSleepMs = sleepEnd - sleepStart;

      // Create the record (using date as primary key)
      const record: DaySleepStages = {
        date,
        stages: validStages.map(s => ({
          startTime: Number(s.startTime),
          endTime: Number(s.endTime),
          stage: Number(s.stage) as SleepStageType
        })),
        stageCount: validStages.length,
        totalSleepMs,
        lightSleepMs,
        deepSleepMs,
        remSleepMs,
        awakeSleepMs,
        sleepStart,
        sleepEnd,
        created_at: now,
        updated_at: now,
      };

      // Use put() which inserts or updates based on primary key (date)
      console.log(`💾 Saving sleep stages to DB:`, {
        date,
        stageCount: validStages.length,
        totalHours: (totalSleepMs / 3600000).toFixed(1),
        lightHours: (lightSleepMs / 3600000).toFixed(1),
        deepHours: (deepSleepMs / 3600000).toFixed(1),
        remHours: (remSleepMs / 3600000).toFixed(1),
        awakeHours: (awakeSleepMs / 3600000).toFixed(1),
      });

      await db.sleepStages.put(record);

      console.log(`✅ Stored ${validStages.length} sleep stages for ${date} (${(totalSleepMs/3600000).toFixed(1)}h total)`);

    } catch (error: any) {
      console.error(`❌ Failed to store sleep stages for ${date}:`, error);
      console.error(`❌ Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get sleep stages for a specific date
   */
  async getStagesByDate(date: string): Promise<DaySleepStages | undefined> {
    return await db.sleepStages.get(date);
  }

  /**
   * Get sleep stages for a date range
   */
  async getStagesByDateRange(startDate: string, endDate: string): Promise<DaySleepStages[]> {
    return await db.sleepStages
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  /**
   * Get all sleep stages
   */
  async getAllStages(): Promise<DaySleepStages[]> {
    const all = await db.sleepStages.toArray();
    // Filter out soft-deleted items in memory
    return all.filter(s => !s.deleted);
  }

  /**
   * Get all sleep stages including soft-deleted ones (for sync)
   */
  async getAllStagesIncludingDeleted(): Promise<DaySleepStages[]> {
    return await db.sleepStages.toArray();
  }

  /**
   * Get stage count summary (how many nights have sleep data)
   */
  async getStageCountSummary(): Promise<{
    totalNights: number;
    totalStages: number;
    avgStagesPerNight: number;
  }> {
    const all = await this.getAllStages();
    const totalNights = all.length;
    const totalStages = all.reduce((sum, night) => sum + (night.stageCount || 0), 0);
    const avgStagesPerNight = totalNights > 0 ? Math.round(totalStages / totalNights) : 0;

    return {
      totalNights,
      totalStages,
      avgStagesPerNight,
    };
  }

  /**
   * Delete sleep stages for a specific date
   */
  async deleteStagesByDate(date: string): Promise<boolean> {
    const existing = await this.getStagesByDate(date);
    if (!existing) return false;

    await db.sleepStages.update(date, {
      deleted: true,
      deleted_at: new Date().toISOString(),
    });

    console.log(`🗑️ Deleted sleep stages for ${date}`);
    return true;
  }

  /**
   * Soft-delete old stages (for retention policy)
   * Marks stages older than the specified number of days as deleted
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const toDelete = await db.sleepStages
      .where('date')
      .below(cutoffDateStr)
      .filter(s => !s.deleted)
      .toArray();

    if (toDelete.length === 0) {
      return 0;
    }

    const now = new Date().toISOString();
    for (const stage of toDelete) {
      await db.sleepStages.update(stage.date, {
        deleted: true,
        deleted_at: now,
      });
    }

    console.log(`🗑️ Soft-deleted ${toDelete.length} old sleep stage nights (older than ${days} days)`);
    return toDelete.length;
  }

  /**
   * Cleanup old sleep stages (75-day retention policy)
   * Called after Health Connect import to prevent unlimited growth
   */
  async cleanupOldStages(): Promise<number> {
    const RETENTION_DAYS = 75; // Consistent with HR samples
    return await this.deleteOlderThan(RETENTION_DAYS);
  }

  /**
   * Get storage size estimate (for monitoring)
   */
  async getStorageSizeEstimate(): Promise<{
    totalNights: number;
    totalStages: number;
    estimatedKB: number;
  }> {
    const summary = await this.getStageCountSummary();

    // Estimate: ~24 bytes per stage (2 timestamps + stage type)
    const estimatedBytes = summary.totalStages * 24;
    const estimatedKB = Math.round(estimatedBytes / 1024);

    return {
      ...summary,
      estimatedKB,
    };
  }

  /**
   * Clear all sleep stages (for testing/debugging)
   */
  async clearAllStages(): Promise<number> {
    const count = await db.sleepStages.count();
    await db.sleepStages.clear();
    console.log(`🗑️ Cleared all ${count} sleep stage nights`);
    return count;
  }
}

export const sleepStagesService = new SleepStagesService();
export default sleepStagesService;
