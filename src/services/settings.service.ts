/**
 * SettingsService
 *
 * Beheert gebruikersinstellingen in de database
 */

import { db } from './database.service';
import { UserSettings, DEFAULT_SETTINGS, SETTINGS_KEYS } from '@/types';

class SettingsService {
  /**
   * Laad gebruikersinstellingen uit database
   * Retourneert DEFAULT_SETTINGS als er nog geen settings zijn
   */
  async loadSettings(): Promise<UserSettings> {
    try {
      const settingsRecord = await db.settings.get(SETTINGS_KEYS.USER_SETTINGS);

      if (settingsRecord && settingsRecord.values) {
        return { ...DEFAULT_SETTINGS, ...settingsRecord.values } as UserSettings;
      }

      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Sla gebruikersinstellingen op in database
   */
  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await db.settings.put({
        key: SETTINGS_KEYS.USER_SETTINGS,
        values: settings,
        updated_at: new Date().toISOString()
      });

      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Reset settings naar defaults
   */
  async resetSettings(): Promise<void> {
    await this.saveSettings(DEFAULT_SETTINGS);
  }

  /**
   * Laad backup reminder settings
   */
  async getBackupReminderSettings(): Promise<{
    enabled: boolean;
    days: number;
    lastBackupDate: string | null;
  }> {
    try {
      const [enabledRecord, daysRecord, lastBackupRecord] = await Promise.all([
        db.settings.get(SETTINGS_KEYS.BACKUP_REMINDER_ENABLED),
        db.settings.get(SETTINGS_KEYS.BACKUP_REMINDER_DAYS),
        db.settings.get(SETTINGS_KEYS.LAST_BACKUP_DATE),
      ]);

      return {
        enabled: enabledRecord?.value ?? true,
        days: daysRecord?.value ?? 7,
        lastBackupDate: lastBackupRecord?.value ?? null,
      };
    } catch (error) {
      console.error('❌ Error loading backup reminder settings:', error);
      return {
        enabled: true,
        days: 7,
        lastBackupDate: null,
      };
    }
  }

  /**
   * Update backup reminder settings
   */
  async updateBackupReminderSettings(
    enabled: boolean,
    days: number
  ): Promise<void> {
    try {
      await Promise.all([
        db.settings.put({
          key: SETTINGS_KEYS.BACKUP_REMINDER_ENABLED,
          value: enabled,
        }),
        db.settings.put({
          key: SETTINGS_KEYS.BACKUP_REMINDER_DAYS,
          value: days,
        }),
      ]);

      console.log('✅ Backup reminder settings saved');
    } catch (error) {
      console.error('❌ Error saving backup reminder settings:', error);
      throw error;
    }
  }

  /**
   * Update last backup date
   */
  async updateLastBackupDate(date?: string): Promise<void> {
    try {
      await db.settings.put({
        key: SETTINGS_KEYS.LAST_BACKUP_DATE,
        value: date || new Date().toISOString(),
      });

      console.log('✅ Last backup date updated');
    } catch (error) {
      console.error('❌ Error updating last backup date:', error);
      throw error;
    }
  }

  /**
   * Get first visit date
   */
  async getFirstVisitDate(): Promise<string | null> {
    try {
      const record = await db.settings.get(SETTINGS_KEYS.FIRST_VISIT_DATE);
      return record?.value ?? null;
    } catch (error) {
      console.error('❌ Error getting first visit date:', error);
      return null;
    }
  }

  /**
   * Set first visit date (eenmalig)
   */
  async setFirstVisitDate(): Promise<void> {
    try {
      const existing = await this.getFirstVisitDate();
      if (!existing) {
        await db.settings.put({
          key: SETTINGS_KEYS.FIRST_VISIT_DATE,
          value: new Date().toISOString(),
        });
        console.log('✅ First visit date set');
      }
    } catch (error) {
      console.error('❌ Error setting first visit date:', error);
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
export default settingsService;
