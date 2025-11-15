import initSqlJs, { Database } from 'sql.js';
import { DailyActivity, HeartRateSample, Weight } from '@/types/database.types';
import { heartRateSamplesService } from './heart-rate-samples.service';

export interface HealthConnectImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  activities: DailyActivity[];
  weights?: Weight[];  // FitDays body composition data
}

export interface ParsedHealthConnectData {
  date: string;
  metrics: {
    steps?: number;
    totalCalories?: number;
    activeCalories?: number;
    restingCalories?: number;
    distanceMeters?: number;
    floorsClimbed?: number;
    sleepSeconds?: number;
    heartRateResting?: number;
    heartRateMax?: number;
    [key: string]: number | undefined;
  };
  sources: string[]; // Which apps contributed data (Garmin, FitDays)
  warnings: string[];
}

/**
 * Health Connect Import Service
 *
 * Parses Android Health Connect SQLite database backups and extracts
 * daily activity metrics from Garmin Connect and FitDays.
 */
class HealthConnectImportService {
  private db: Database | null = null;

  /**
   * Parse a Health Connect database file
   */
  async parseDatabase(file: File): Promise<ParsedHealthConnectData[]> {
    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: (filename) => `https://sql.js.org/dist/${filename}`
      });

      // Read file
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Open database
      this.db = new SQL.Database(uint8Array);

      // Check if this is a valid Health Connect database
      this.validateDatabase();

      // Debug: Show all available FitDays data
      this.debugFitDaysTables();

      // Get all unique dates from the database
      const dates = this.getUniqueDates();

      // Parse data for each date
      const results: ParsedHealthConnectData[] = [];

      for (const epochDay of dates) {
        const parsed = await this.parseDayData(epochDay);
        if (parsed) {
          results.push(parsed);
        }
      }

      return results.sort((a, b) => a.date.localeCompare(b.date));

    } catch (error: any) {
      throw new Error(`Health Connect database parsing failed: ${error?.message || error}`);
    }
  }

  /**
   * Validate that this is a Health Connect database
   */
  private validateDatabase(): void {
    if (!this.db) throw new Error('Database not loaded');

    // Check for characteristic Health Connect tables
    const result = this.db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND (
        name LIKE '%_record_table' OR
        name = 'application_info_table'
      )
      LIMIT 1
    `);

    if (!result.length || !result[0].values.length) {
      throw new Error('Dit lijkt geen Health Connect database te zijn');
    }
  }

  /**
   * Debug: List all available FitDays tables and sample data
   * Call this after loading the database to see what metrics are available
   */
  debugFitDaysTables(): void {
    if (!this.db) {
      console.error('❌ Database not loaded');
      return;
    }

    console.log('🔍 DEBUG: Scanning for FitDays data...');

    // Get app_info_id for FitDays (usually 3)
    const appInfoResult = this.db.exec(`
      SELECT row_id, app_name FROM application_info_table
      WHERE app_name LIKE '%FitDays%' OR app_name LIKE '%Sacoma%'
    `);

    const fitDaysAppId = appInfoResult[0]?.values[0]?.[0] || 3;
    console.log(`📱 FitDays app_info_id: ${fitDaysAppId}`);

    // Get all record tables
    const tablesResult = this.db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name LIKE '%_record_table'
      ORDER BY name
    `);

    const tables = tablesResult[0]?.values.map(row => row[0] as string) || [];
    console.log(`📊 Found ${tables.length} record tables`);

    // For each table, check if FitDays has data
    tables.forEach(tableName => {
      try {
        const dataResult = this.db!.exec(`
          SELECT COUNT(*) as count FROM ${tableName}
          WHERE app_info_id = ${fitDaysAppId}
        `);

        const count = dataResult[0]?.values[0]?.[0] as number;
        if (count > 0) {
          console.log(`✅ ${tableName}: ${count} records from FitDays`);

          // Get column names
          const columnsResult = this.db!.exec(`PRAGMA table_info(${tableName})`);
          const columns = columnsResult[0]?.values.map(row => row[1] as string) || [];
          console.log(`   Columns:`, columns.join(', '));

          // Get sample data
          const sampleResult = this.db!.exec(`
            SELECT * FROM ${tableName}
            WHERE app_info_id = ${fitDaysAppId}
            LIMIT 1
          `);
          if (sampleResult[0]?.values[0]) {
            console.log(`   Sample data:`, sampleResult[0].values[0]);
          }
        }
      } catch (err) {
        // Skip tables that error out
      }
    });

    console.log('🔍 DEBUG: FitDays scan complete');
  }

  /**
   * Get all unique dates that have data
   */
  private getUniqueDates(): number[] {
    if (!this.db) throw new Error('Database not loaded');

    const result = this.db.exec(`
      SELECT DISTINCT local_date
      FROM steps_record_table
      WHERE local_date IS NOT NULL
      ORDER BY local_date
    `);

    if (!result.length || !result[0].values.length) {
      throw new Error('Geen data gevonden in de database');
    }

    return result[0].values.map(row => row[0] as number);
  }

  /**
   * Parse all metrics for a specific date
   */
  private async parseDayData(epochDay: number): Promise<ParsedHealthConnectData | null> {
    if (!this.db) return null;

    const date = this.epochDaysToDate(epochDay);
    const metrics: ParsedHealthConnectData['metrics'] = {};
    const sources: Set<string> = new Set();
    const warnings: string[] = [];

    // 1. Steps (Garmin)
    try {
      const stepsResult = this.db.exec(`
        SELECT SUM(count) as total_steps
        FROM steps_record_table
        WHERE local_date = ${epochDay}
          AND app_info_id = 4  -- Garmin Connect
      `);

      if (stepsResult[0]?.values[0]?.[0]) {
        metrics.steps = stepsResult[0].values[0][0] as number;
        sources.add('Garmin Connect');
      }
    } catch (err) {
      warnings.push('Kon steps niet ophalen');
    }

    // 2. Total Calories (Garmin)
    // IMPORTANT: Health Connect stores energy in joules, but Garmin exports seem to use calories
    // Dividing by 1000 converts from calories to kcal
    try {
      const caloriesResult = this.db.exec(`
        SELECT energy
        FROM total_calories_burned_record_table
        WHERE local_date = ${epochDay}
          AND app_info_id = 4  -- Garmin Connect
      `);

      if (caloriesResult[0]?.values[0]?.[0]) {
        const rawEnergy = caloriesResult[0].values[0][0] as number;
        // Based on analysis: values like 2,220,000 are calories (not joules)
        // Divide by 1000 to get kcal
        metrics.totalCalories = Math.round(rawEnergy / 1000);
        sources.add('Garmin Connect');
      }
    } catch (err) {
      warnings.push('Kon calories niet ophalen');
    }

    // 3. Basal Metabolic Rate (FitDays) - use as resting calories
    try {
      const bmrResult = this.db.exec(`
        SELECT basal_metabolic_rate
        FROM basal_metabolic_rate_record_table
        WHERE local_date = ${epochDay}
          AND app_info_id = 3  -- FitDays
      `);

      if (bmrResult[0]?.values[0]?.[0]) {
        const bmr = bmrResult[0].values[0][0] as number;
        // BMR values seem to be in kcal/day (e.g., 85.86)
        // This seems too low - might be per hour or incorrectly scaled
        // For now, use directly but flag as potentially incorrect
        metrics.restingCalories = Math.round(bmr);
        sources.add('FitDays');

        if (bmr < 1000) {
          warnings.push('BMR waarde lijkt te laag (mogelijk verkeerde eenheid)');
        }
      }
    } catch (err) {
      // BMR is optional
    }

    // 4. Active Calories (calculated if we have total and resting)
    if (metrics.totalCalories && metrics.restingCalories) {
      metrics.activeCalories = Math.max(0, metrics.totalCalories - metrics.restingCalories);
    } else {
      warnings.push('Active calories niet beschikbaar (berekening vereist total en resting)');
    }

    // 5. Distance (Garmin)
    try {
      const distanceResult = this.db.exec(`
        SELECT distance
        FROM distance_record_table
        WHERE local_date = ${epochDay}
          AND app_info_id = 4  -- Garmin Connect
      `);

      if (distanceResult[0]?.values[0]?.[0]) {
        metrics.distanceMeters = Math.round(distanceResult[0].values[0][0] as number);
        sources.add('Garmin Connect');
      }
    } catch (err) {
      // Distance is optional
    }

    // 6. Floors Climbed (Garmin)
    try {
      const floorsResult = this.db.exec(`
        SELECT SUM(floors) as total_floors
        FROM floors_climbed_record_table
        WHERE local_date = ${epochDay}
          AND app_info_id = 4  -- Garmin Connect
      `);

      if (floorsResult[0]?.values[0]?.[0]) {
        metrics.floorsClimbed = Math.round(floorsResult[0].values[0][0] as number);
        sources.add('Garmin Connect');
      }
    } catch (err) {
      // Floors is optional
    }

    // 7. Sleep Duration (Garmin)
    try {
      const sleepResult = this.db.exec(`
        SELECT start_time, end_time
        FROM sleep_session_record_table
        WHERE local_date = ${epochDay}
          AND app_info_id = 4  -- Garmin Connect
      `);

      if (sleepResult[0]?.values[0]) {
        const startTime = sleepResult[0].values[0][0] as number;
        const endTime = sleepResult[0].values[0][1] as number;
        metrics.sleepSeconds = Math.round((endTime - startTime) / 1000);
        sources.add('Garmin Connect');
      }
    } catch (err) {
      // Sleep is optional
    }

    // 8. Resting Heart Rate (Garmin)
    try {
      const rhrResult = this.db.exec(`
        SELECT beats_per_minute
        FROM resting_heart_rate_record_table
        WHERE local_date = ${epochDay}
          AND app_info_id = 4  -- Garmin Connect
      `);

      if (rhrResult[0]?.values[0]?.[0]) {
        metrics.heartRateResting = rhrResult[0].values[0][0] as number;
        sources.add('Garmin Connect');
      }
    } catch (err) {
      // HR is optional
    }

    // 9. Max Heart Rate (Garmin)
    try {
      const maxHrResult = this.db.exec(`
        SELECT MAX(hrs.beats_per_minute) as max_bpm
        FROM heart_rate_record_series_table hrs
        JOIN heart_rate_record_table hr ON hr.row_id = hrs.parent_key
        WHERE hr.local_date = ${epochDay}
          AND hr.app_info_id = 4  -- Garmin Connect
      `);

      if (maxHrResult[0]?.values[0]?.[0]) {
        metrics.heartRateMax = maxHrResult[0].values[0][0] as number;
        sources.add('Garmin Connect');
      }
    } catch (err) {
      // Max HR is optional
    }

    // Note: Heart Rate Samples extraction is now done separately during import
    // to avoid writing to DB during preview

    // Add warnings for commonly missing fields
    if (!metrics.heartRateResting && !metrics.heartRateMax) {
      warnings.push('Geen hartslaggegevens beschikbaar');
    }

    return {
      date,
      metrics,
      sources: Array.from(sources),
      warnings
    };
  }

  /**
   * Extract and store heart rate samples (intraday data) for all dates
   * Should be called during import, not during preview
   */
  async extractAndStoreAllHeartRateSamples(): Promise<void> {
    if (!this.db) {
      console.warn('❌ Database not loaded, cannot extract HR samples');
      return;
    }

    // Get all unique dates that have HR data
    const datesResult = this.db.exec(`
      SELECT DISTINCT hr.local_date
      FROM heart_rate_record_table hr
      WHERE hr.app_info_id = 4  -- Garmin Connect
      ORDER BY hr.local_date
    `);

    if (!datesResult[0]?.values || datesResult[0].values.length === 0) {
      console.log('ℹ️ No heart rate data found');
      return;
    }

    const epochDays = datesResult[0].values.map(row => row[0] as number);
    console.log(`💓 Extracting HR samples for ${epochDays.length} days...`);

    for (const epochDay of epochDays) {
      const date = this.epochDaysToDate(epochDay);
      try {
        await this.extractAndStoreHeartRateSamplesForDay(epochDay, date);
      } catch (err) {
        console.warn(`Could not extract HR samples for ${date}:`, err);
      }
    }

    console.log(`✅ Finished extracting HR samples`);
  }

  /**
   * Extract and store heart rate samples (intraday data) for a specific day
   */
  private async extractAndStoreHeartRateSamplesForDay(epochDay: number, date: string): Promise<void> {
    if (!this.db) return;

    // Get all HR samples for this day
    const samplesResult = this.db.exec(`
      SELECT hrs.epoch_millis, hrs.beats_per_minute
      FROM heart_rate_record_series_table hrs
      JOIN heart_rate_record_table hr ON hr.row_id = hrs.parent_key
      WHERE hr.local_date = ${epochDay}
        AND hr.app_info_id = 4  -- Garmin Connect
      ORDER BY hrs.epoch_millis ASC
    `);

    if (!samplesResult[0]?.values || samplesResult[0].values.length === 0) {
      return; // No HR data for this day
    }

    // Convert to HeartRateSample format
    const samples: HeartRateSample[] = samplesResult[0].values.map(row => ({
      timestamp: row[0] as number,  // epoch_millis
      bpm: row[1] as number          // beats_per_minute
    }));

    // Store in database
    await heartRateSamplesService.addOrUpdateSamples(date, samples);

    console.log(`💓 Stored ${samples.length} HR samples for ${date}`);
  }

  /**
   * Extract FitDays body composition data (weight, body fat, bone mass, BMR)
   * Returns array of Weight objects with body composition metrics
   */
  async extractFitDaysBodyComposition(): Promise<Weight[]> {
    if (!this.db) {
      throw new Error('Database not loaded');
    }

    console.log('🏋️ Extracting FitDays body composition data...');

    // Get all dates that have weight data from FitDays
    const datesResult = this.db.exec(`
      SELECT DISTINCT local_date
      FROM weight_record_table
      WHERE app_info_id = 3  -- FitDays
      ORDER BY local_date
    `);

    if (!datesResult[0]?.values || datesResult[0].values.length === 0) {
      console.log('⚠️ No FitDays weight data found');
      return [];
    }

    const epochDays = datesResult[0].values.map(row => row[0] as number);
    const weights: Weight[] = [];

    for (const epochDay of epochDays) {
      const date = this.epochDaysToDate(epochDay);

      // Get weight (in grams, need to convert to kg)
      const weightResult = this.db.exec(`
        SELECT weight, time, last_modified_time
        FROM weight_record_table
        WHERE local_date = ${epochDay} AND app_info_id = 3
        ORDER BY time DESC
        LIMIT 1
      `);

      if (!weightResult[0]?.values[0]) continue;

      const weightGrams = weightResult[0].values[0][0] as number;
      const timestamp = weightResult[0].values[0][1] as number;
      const lastModified = weightResult[0].values[0][2] as number;

      // Get body fat percentage
      const bodyFatResult = this.db.exec(`
        SELECT percentage
        FROM body_fat_record_table
        WHERE local_date = ${epochDay} AND app_info_id = 3
        ORDER BY time DESC
        LIMIT 1
      `);
      const bodyFat = bodyFatResult[0]?.values[0]?.[0] as number | undefined;

      // Get bone mass (in grams, convert to kg)
      const boneMassResult = this.db.exec(`
        SELECT mass
        FROM bone_mass_record_table
        WHERE local_date = ${epochDay} AND app_info_id = 3
        ORDER BY time DESC
        LIMIT 1
      `);
      const boneMassGrams = boneMassResult[0]?.values[0]?.[0] as number | undefined;

      // Get BMR (Basal Metabolic Rate in kcal)
      const bmrResult = this.db.exec(`
        SELECT basal_metabolic_rate
        FROM basal_metabolic_rate_record_table
        WHERE local_date = ${epochDay} AND app_info_id = 3
        ORDER BY time DESC
        LIMIT 1
      `);
      const bmr = bmrResult[0]?.values[0]?.[0] as number | undefined;

      // Create Weight object
      const weight: Weight = {
        id: `hc_weight_${date}`,
        date,
        weight: parseFloat((weightGrams / 1000).toFixed(2)), // Convert grams to kg
        bodyFat: bodyFat ? parseFloat(bodyFat.toFixed(1)) : undefined,
        boneMass: boneMassGrams ? parseFloat((boneMassGrams / 1000).toFixed(2)) : undefined,
        bmr: bmr ? Math.round(bmr) : undefined,
        source: 'health_connect',
        created_at: new Date(timestamp).toISOString(),
        updated_at: new Date(lastModified).toISOString(),
      };

      weights.push(weight);

      console.log(`✅ ${date}: ${weight.weight}kg, BF: ${weight.bodyFat}%, Bone: ${weight.boneMass}kg, BMR: ${weight.bmr}kcal`);
    }

    console.log(`🏋️ Extracted ${weights.length} FitDays weight measurements`);
    return weights;
  }

  /**
   * Convert epoch days to YYYY-MM-DD format
   */
  private epochDaysToDate(epochDays: number): string {
    const msPerDay = 86400000; // 24 * 60 * 60 * 1000
    const date = new Date(epochDays * msPerDay);
    return date.toISOString().split('T')[0];
  }

  /**
   * Convert parsed data to DailyActivity objects
   *
   * IMPORTANT: Only include fields that have actual values (not undefined, not 0)
   * Exception: intensityMinutes should keep 0 if it's explicitly 0, but omit if undefined
   * This prevents overwriting existing data with empty values during merge
   */
  convertToActivities(parsedData: ParsedHealthConnectData[]): DailyActivity[] {
    return parsedData.map(data => {
      const activity: Partial<DailyActivity> = {
        date: data.date,
        activities: []
      };

      // Only add fields if they have valid values (not undefined, not 0)
      if (data.metrics.totalCalories) activity.totalCalories = data.metrics.totalCalories;
      if (data.metrics.activeCalories) activity.activeCalories = data.metrics.activeCalories;
      if (data.metrics.restingCalories) activity.restingCalories = data.metrics.restingCalories;
      if (data.metrics.steps) activity.steps = data.metrics.steps;
      if (data.metrics.distanceMeters) activity.distanceMeters = data.metrics.distanceMeters;
      if (data.metrics.floorsClimbed) activity.floorsClimbed = data.metrics.floorsClimbed;
      if (data.metrics.heartRateResting) activity.heartRateResting = data.metrics.heartRateResting;
      if (data.metrics.heartRateMax) activity.heartRateMax = data.metrics.heartRateMax;
      if (data.metrics.sleepSeconds) activity.sleepSeconds = data.metrics.sleepSeconds;

      // Note: intensityMinutes, stressLevel, bodyBattery, hrvOvernight, hrv7DayAvg
      // are not available in Health Connect, so we don't set them at all
      // This allows existing values to be preserved during merge

      return activity as DailyActivity;
    });
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const healthConnectImportService = new HealthConnectImportService();
