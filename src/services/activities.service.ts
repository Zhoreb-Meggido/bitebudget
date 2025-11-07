/**
 * ActivitiesService
 *
 * CRUD operaties voor daily activities (Garmin data)
 */

import { db } from './database.service';
import type { DailyActivity } from '@/types';
import { getTimestamp, generateId } from '@/utils';

class ActivitiesService {
  /**
   * Laad alle activities
   */
  async getAllActivities(): Promise<DailyActivity[]> {
    try {
      return await db.dailyActivities.orderBy('date').reverse().toArray();
    } catch (error) {
      console.error('❌ Error loading activities:', error);
      return [];
    }
  }

  /**
   * Laad activity voor specifieke datum
   */
  async getActivityByDate(date: string): Promise<DailyActivity | undefined> {
    try {
      return await db.dailyActivities
        .where('date')
        .equals(date)
        .first();
    } catch (error) {
      console.error('❌ Error loading activity by date:', error);
      return undefined;
    }
  }

  /**
   * Laad activities voor een datumbereik
   */
  async getActivitiesBetweenDates(startDate: string, endDate: string): Promise<DailyActivity[]> {
    try {
      return await db.dailyActivities
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray();
    } catch (error) {
      console.error('❌ Error loading activities between dates:', error);
      return [];
    }
  }

  /**
   * Voeg nieuwe activity toe of update bestaande (op basis van datum)
   */
  async addOrUpdateActivity(activity: Omit<DailyActivity, 'id' | 'created_at' | 'updated_at'>): Promise<DailyActivity> {
    try {
      // Check if activity for this date already exists
      const existing = await this.getActivityByDate(activity.date);

      if (existing) {
        // Update existing
        const updated = {
          ...existing,
          ...activity,
          updated_at: getTimestamp(),
        };
        await db.dailyActivities.update(existing.id!, updated);
        console.log('✅ Activity updated for date:', activity.date);
        return updated;
      } else {
        // Add new
        const now = getTimestamp();
        const newActivity: DailyActivity = {
          ...activity,
          id: generateId(),
          created_at: now,
          updated_at: now,
        };
        await db.dailyActivities.add(newActivity);
        console.log('✅ Activity added for date:', activity.date);
        return newActivity;
      }
    } catch (error) {
      console.error('❌ Error adding/updating activity:', error);
      throw error;
    }
  }

  /**
   * Update bestaande activity
   */
  async updateActivity(id: number | string, updates: Partial<DailyActivity>): Promise<void> {
    try {
      await db.dailyActivities.update(id, {
        ...updates,
        updated_at: getTimestamp(),
      });
      console.log('✅ Activity updated:', id);
    } catch (error) {
      console.error('❌ Error updating activity:', error);
      throw error;
    }
  }

  /**
   * Verwijder activity
   */
  async deleteActivity(id: number | string): Promise<void> {
    try {
      await db.dailyActivities.delete(id);
      console.log('✅ Activity deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting activity:', error);
      throw error;
    }
  }

  /**
   * Verwijder activity op basis van datum
   */
  async deleteActivityByDate(date: string): Promise<void> {
    try {
      const activity = await this.getActivityByDate(date);
      if (activity && activity.id) {
        await this.deleteActivity(activity.id);
      }
    } catch (error) {
      console.error('❌ Error deleting activity by date:', error);
      throw error;
    }
  }

  /**
   * Bulk add activities (voor import/sync)
   */
  async bulkAddActivities(activities: DailyActivity[]): Promise<number> {
    try {
      const existingActivities = await this.getAllActivities();
      const existingDates = new Set(existingActivities.map(a => a.date));

      // Update existing activities, add new ones
      let addedCount = 0;
      let updatedCount = 0;

      for (const activity of activities) {
        const existing = existingActivities.find(a => a.date === activity.date);

        if (existing) {
          // Update if cloud data is newer
          if (activity.updated_at && existing.updated_at &&
              new Date(activity.updated_at) > new Date(existing.updated_at)) {
            await db.dailyActivities.update(existing.id!, {
              ...activity,
              id: existing.id, // Keep local ID
            });
            updatedCount++;
          }
        } else {
          // Add new activity
          await db.dailyActivities.add(activity);
          addedCount++;
        }
      }

      console.log(`✅ Bulk added ${addedCount} activities, updated ${updatedCount}`);
      return addedCount + updatedCount;
    } catch (error) {
      console.error('❌ Error bulk adding activities:', error);
      throw error;
    }
  }

  /**
   * Clear alle activities (voorzichtig!)
   */
  async clearAllActivities(): Promise<number> {
    try {
      const count = await db.dailyActivities.count();
      await db.dailyActivities.clear();
      console.log(`✅ ${count} activities cleared`);
      return count;
    } catch (error) {
      console.error('❌ Error clearing activities:', error);
      throw error;
    }
  }

  /**
   * Get laatste sync datum (voor Garmin sync)
   */
  async getLastActivityDate(): Promise<string | null> {
    try {
      const latest = await db.dailyActivities
        .orderBy('date')
        .reverse()
        .first();
      return latest?.date || null;
    } catch (error) {
      console.error('❌ Error getting last activity date:', error);
      return null;
    }
  }
}

// Export singleton instance
export const activitiesService = new ActivitiesService();
export default activitiesService;
