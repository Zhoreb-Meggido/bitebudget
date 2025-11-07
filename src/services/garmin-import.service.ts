/**
 * Garmin CSV Import Service
 *
 * Parses multiple Garmin CSV export files and merges them into DailyActivity records
 * Supports various Garmin export formats (calories, steps, stress, intensity, etc.)
 */

import type { DailyActivity } from '@/types';
import { activitiesService } from './activities.service';

export interface ParsedGarminData {
  date: string;
  calories?: {
    active: number;
    resting: number;
    total: number;
  };
  steps?: number;
  intensityMinutes?: number;
  stress?: number;
  distance?: number;
  heartRate?: {
    resting: number;
    max: number;
  };
}

export interface ImportResult {
  success: boolean;
  daysImported: number;
  errors: string[];
  preview: ParsedGarminData[];
}

class GarminImportService {
  /**
   * Parse multiple Garmin CSV files and merge data by date
   */
  async parseMultipleFiles(files: File[]): Promise<ParsedGarminData[]> {
    const allData = new Map<string, ParsedGarminData>();

    for (const file of files) {
      try {
        const text = await file.text();
        const fileData = this.parseCSV(text, file.name);

        // Merge data by date
        for (const dayData of fileData) {
          const existing = allData.get(dayData.date) || { date: dayData.date };
          allData.set(dayData.date, { ...existing, ...dayData });
        }
      } catch (error) {
        console.error(`Error parsing ${file.name}:`, error);
      }
    }

    return Array.from(allData.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Parse a single CSV file and detect its type
   */
  private parseCSV(text: string, filename: string): ParsedGarminData[] {
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    // Detect type based on headers
    const headers = lines[0].toLowerCase();

    if (headers.includes('active calories')) {
      return this.parseCaloriesCSV(lines);
    } else if (headers.includes('intensity minutes')) {
      return this.parseIntensityCSV(lines);
    } else if (headers.includes('stress')) {
      return this.parseStressCSV(lines);
    } else if (headers.includes('steps')) {
      return this.parseStepsCSV(lines);
    } else if (headers.includes('distance')) {
      return this.parseDistanceCSV(lines);
    } else if (headers.includes('heart rate') || headers.includes('resting hr')) {
      return this.parseHeartRateCSV(lines);
    }

    // Try generic parsing as fallback
    return this.parseGenericCSV(lines);
  }

  /**
   * Parse Calories CSV
   * Format: ,Active Calories,Resting Calories,Total
   *         10/31/2024,4950,15036,19986
   */
  private parseCaloriesCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 4) continue;

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      result.push({
        date,
        calories: {
          active: parseFloat(parts[1]) || 0,
          resting: parseFloat(parts[2]) || 0,
          total: parseFloat(parts[3]) || 0,
        },
      });
    }

    return result;
  }

  /**
   * Parse Intensity Minutes CSV
   * Format: Intensity Minutes Weekly Total
   *         ,Actual,Value
   *         2024-11-04,335,360
   */
  private parseIntensityCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    // Find header row
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('actual') || lines[i].includes(',')) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) return result;

    // Parse data rows
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 2) continue;

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      const minutes = parseFloat(parts[1]) || 0;

      // Weekly total - distribute evenly across 7 days
      const dailyMinutes = Math.round(minutes / 7);

      result.push({
        date,
        intensityMinutes: dailyMinutes,
      });
    }

    return result;
  }

  /**
   * Parse Stress CSV
   * Format: ,Stress
   *         10/31/2024,36
   */
  private parseStressCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 2) continue;

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      result.push({
        date,
        stress: parseFloat(parts[1]) || 0,
      });
    }

    return result;
  }

  /**
   * Parse Steps CSV (similar format to stress)
   */
  private parseStepsCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 2) continue;

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      result.push({
        date,
        steps: parseInt(parts[1]) || 0,
      });
    }

    return result;
  }

  /**
   * Parse Distance CSV
   */
  private parseDistanceCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 2) continue;

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      // Distance might be in km, convert to meters
      const distance = parseFloat(parts[1]) || 0;
      result.push({
        date,
        distance: distance * 1000, // km to meters
      });
    }

    return result;
  }

  /**
   * Parse Heart Rate CSV
   */
  private parseHeartRateCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 3) continue;

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      result.push({
        date,
        heartRate: {
          resting: parseFloat(parts[1]) || 0,
          max: parseFloat(parts[2]) || 0,
        },
      });
    }

    return result;
  }

  /**
   * Generic CSV parser (fallback)
   */
  private parseGenericCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];
    // Try to parse as date,value format
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 2) continue;

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      // Can't determine what the value represents, skip
      console.warn('Unknown CSV format, skipping row:', lines[i]);
    }
    return result;
  }

  /**
   * Parse date from various formats
   * Supports: MM/DD/YYYY, YYYY-MM-DD, etc.
   */
  private parseDate(dateStr: string): string | null {
    if (!dateStr || dateStr.trim() === '') return null;

    try {
      // Try MM/DD/YYYY format (10/31/2024)
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        if (month && day && year) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      // Try YYYY-MM-DD format (already correct)
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }

      // Try parsing as Date object
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
    }

    return null;
  }

  /**
   * Convert parsed data to DailyActivity format and save to database
   */
  async importData(parsedData: ParsedGarminData[]): Promise<ImportResult> {
    const errors: string[] = [];
    let imported = 0;

    for (const dayData of parsedData) {
      try {
        // Check if we have any meaningful data
        const hasData =
          dayData.calories ||
          dayData.steps ||
          dayData.intensityMinutes ||
          dayData.stress ||
          dayData.distance ||
          dayData.heartRate;

        if (!hasData) {
          continue; // Skip empty days
        }

        const activity: Omit<DailyActivity, 'id' | 'created_at' | 'updated_at'> = {
          date: dayData.date,
          totalCalories: dayData.calories?.total || 0,
          activeCalories: dayData.calories?.active || 0,
          restingCalories: dayData.calories?.resting || 0,
          steps: dayData.steps || 0,
          intensityMinutes: dayData.intensityMinutes,
          distanceMeters: dayData.distance,
          stressLevel: dayData.stress,
          heartRateResting: dayData.heartRate?.resting,
          heartRateMax: dayData.heartRate?.max,
        };

        await activitiesService.addOrUpdateActivity(activity);
        imported++;
      } catch (error) {
        errors.push(`Failed to import ${dayData.date}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      daysImported: imported,
      errors,
      preview: parsedData,
    };
  }

  /**
   * Preview import without saving
   */
  async previewImport(files: File[]): Promise<ParsedGarminData[]> {
    return await this.parseMultipleFiles(files);
  }
}

export const garminImportService = new GarminImportService();
export default garminImportService;
