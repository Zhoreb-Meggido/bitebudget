/**
 * Version Constants
 *
 * Centralized version management for the application
 */

// Import app version from package.json
import packageJson from '../../package.json';

/**
 * Current application version (from package.json)
 * Used for display in UI and service worker versioning
 */
export const APP_VERSION = packageJson.version;

/**
 * Backup/Export Schema Versions
 *
 * These versions indicate the DATA STRUCTURE, not the app version.
 * Only increment when the data structure changes (new fields, new tables, etc.)
 *
 * Version History:
 * - 1.0: Initial schema (entries, products, weights, settings)
 * - 1.3: Added productPortions and mealTemplates
 * - 1.5: Added dailyActivities (Google Fit integration)
 * - 1.6: Added heartRateSamples (intraday HR data, 75-day retention)
 * - 1.10: Added sleepStages (intraday sleep data, 75-day retention)
 * - 1.11: Added stepsSamples (intraday steps data, 75-day retention)
 */
export const BACKUP_SCHEMA_VERSION = {
  /** Current full backup schema version (all data types) */
  CURRENT: '1.11',

  /** Legacy: Initial schema with basic data */
  V1_0: '1.0',

  /** Added portions and templates support */
  V1_3: '1.3',

  /** Added daily activities (Google Fit) */
  V1_5: '1.5',

  /** Added heart rate samples (intraday data) */
  V1_6: '1.6',

  /** Added sleep stages (intraday data) */
  V1_10: '1.10',

  /** Added steps samples (intraday data) */
  V1_11: '1.11',
} as const;

/**
 * Get the appropriate schema version for a backup type
 */
export function getBackupSchemaVersion(includeActivities: boolean = true, includePortionsTemplates: boolean = true): string {
  if (includeActivities) {
    return BACKUP_SCHEMA_VERSION.V1_5;
  } else if (includePortionsTemplates) {
    return BACKUP_SCHEMA_VERSION.V1_3;
  }
  return BACKUP_SCHEMA_VERSION.V1_0;
}

/**
 * Check if a backup data structure supports a specific feature
 */
export function supportsFeature(version: string, feature: 'activities' | 'portions' | 'templates' | 'heartRateSamples' | 'sleepStages' | 'stepsSamples'): boolean {
  const versionNum = parseFloat(version);

  switch (feature) {
    case 'stepsSamples':
      return versionNum >= 1.11;
    case 'sleepStages':
      return versionNum >= 1.10;
    case 'heartRateSamples':
      return versionNum >= 1.6;
    case 'activities':
      return versionNum >= 1.5;
    case 'portions':
    case 'templates':
      return versionNum >= 1.3;
    default:
      return false;
  }
}
