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
  sleepSeconds?: number;
  bodyBattery?: number;
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
    } else if (headers.includes('sleep') || headers.includes('avg duration')) {
      return this.parseSleepCSV(lines);
    }

    // Try generic parsing as fallback
    return this.parseGenericCSV(lines);
  }

  /**
   * Parse Calories CSV
   * Supports both daily and weekly formats:
   * - Daily: ,Active Calories,Resting Calories,Total
   *          10/31/2024,707,2143,2850
   * - Weekly: ,Active Calories,Resting Calories,Total
   *           10/31/2024,4950,15036,19986
   */
  private parseCaloriesCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    // Detect if data is weekly or daily by checking first data row
    let isWeeklyData = false;
    if (lines.length > 1) {
      const firstDataParts = lines[1].split(',');
      if (firstDataParts.length >= 4) {
        const totalCalories = parseFloat(firstDataParts[3]) || 0;
        // If total > 5000, it's likely weekly data (normal daily is 1500-3500)
        isWeeklyData = totalCalories > 5000;
      }
    }

    const divisor = isWeeklyData ? 7 : 1;
    if (isWeeklyData) {
      console.log('📊 Detected weekly calories data, converting to daily averages');
    }

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 4) continue;

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      const active = parseFloat(parts[1]) || 0;
      const resting = parseFloat(parts[2]) || 0;
      const total = parseFloat(parts[3]) || 0;

      result.push({
        date,
        calories: {
          active: Math.round(active / divisor),
          resting: Math.round(resting / divisor),
          total: Math.round(total / divisor),
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
   * Parse Sleep CSV (supports both weekly and daily formats)
   * Weekly format: Date,Avg Score,Avg Quality,Avg Duration,...
   *                Nov 1-7,65,Fair,6h 11min,...
   * Daily format: Sleep Score 4 Weeks,Score,Resting Heart Rate,Body Battery,Pulse Ox,Respiration,Skin Temp Change,HRV Status,Quality,Duration,...
   *               2025-11-07,88,53,72,96.18,14.63,+0.3°,34,Good,7h 55min,...
   */
  private parseSleepCSV(lines: string[]): ParsedGarminData[] {
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase();

    // Detect format based on headers
    if (headers.includes('sleep score') || headers.includes('body battery')) {
      return this.parseSleepDailyCSV(lines);
    } else {
      return this.parseSleepWeeklyCSV(lines);
    }
  }

  /**
   * Parse weekly sleep summary
   */
  private parseSleepWeeklyCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 4) continue;

      // Parse week range (e.g., "Nov 1-7" or "Oct 25-31")
      const date = this.parseWeekRangeStart(parts[0]);
      if (!date) continue;

      // Parse duration (e.g., "6h 11min")
      const sleepSeconds = this.parseDuration(parts[3]);

      if (sleepSeconds > 0) {
        result.push({
          date,
          sleepSeconds,
        });
      }
    }

    return result;
  }

  /**
   * Parse daily sleep data
   * Format: Sleep Score 4 Weeks,Score,Resting Heart Rate,Body Battery,Pulse Ox,Respiration,Skin Temp Change,HRV Status,Quality,Duration,...
   */
  private parseSleepDailyCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    // Parse headers to find column indices
    const headers = lines[0].split(',');
    const dateCol = 0;
    const restingHRCol = headers.findIndex(h => h.toLowerCase().includes('resting heart rate'));
    const bodyBatteryCol = headers.findIndex(h => h.toLowerCase().includes('body battery'));
    const durationCol = headers.findIndex(h => h.toLowerCase() === 'duration');

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 2) continue;

      // Parse date (already in YYYY-MM-DD format)
      const date = this.parseDate(parts[dateCol]);
      if (!date) continue;

      const data: ParsedGarminData = { date };

      // Parse duration
      if (durationCol >= 0 && parts[durationCol]) {
        const sleepSeconds = this.parseDuration(parts[durationCol]);
        if (sleepSeconds > 0) {
          data.sleepSeconds = sleepSeconds;
        }
      }

      // Parse resting heart rate
      if (restingHRCol >= 0 && parts[restingHRCol]) {
        const restingHR = parseFloat(parts[restingHRCol]);
        if (!isNaN(restingHR) && restingHR > 0) {
          data.heartRate = {
            resting: restingHR,
            max: 0, // Not available in this format
          };
        }
      }

      // Parse Body Battery
      if (bodyBatteryCol >= 0 && parts[bodyBatteryCol]) {
        const bodyBattery = parseFloat(parts[bodyBatteryCol]);
        if (!isNaN(bodyBattery) && bodyBattery > 0) {
          data.bodyBattery = bodyBattery;
        }
      }

      // Only add if we have some data
      if (data.sleepSeconds || data.heartRate || data.bodyBattery) {
        result.push(data);
      }
    }

    return result;
  }

  /**
   * Parse duration string like "6h 11min" to seconds
   */
  private parseDuration(duration: string): number {
    if (!duration) return 0;

    let totalSeconds = 0;

    // Match hours (e.g., "6h")
    const hoursMatch = duration.match(/(\d+)h/);
    if (hoursMatch) {
      totalSeconds += parseInt(hoursMatch[1]) * 3600;
    }

    // Match minutes (e.g., "11min")
    const minutesMatch = duration.match(/(\d+)min/);
    if (minutesMatch) {
      totalSeconds += parseInt(minutesMatch[1]) * 60;
    }

    return totalSeconds;
  }

  /**
   * Parse week range and return start date
   * Examples: "Nov 1-7", "Oct 25-31"
   */
  private parseWeekRangeStart(weekRange: string): string | null {
    if (!weekRange) return null;

    try {
      // Extract month and start day (e.g., "Nov 1-7" -> "Nov 1")
      const match = weekRange.match(/([A-Za-z]+)\s+(\d+)-/);
      if (!match) return null;

      const monthName = match[1];
      const startDay = match[2];

      // Determine year (assume current year, or previous year if month is December and we're in January)
      const currentDate = new Date();
      let year = currentDate.getFullYear();

      // If we're in January and the month is December, use previous year
      const currentMonth = currentDate.getMonth();
      const monthIndex = this.getMonthIndex(monthName);
      if (currentMonth === 0 && monthIndex === 11) {
        year--;
      }

      // Construct date
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${startDay.padStart(2, '0')}`;
      return dateStr;
    } catch (error) {
      console.error('Error parsing week range:', weekRange, error);
      return null;
    }
  }

  /**
   * Get month index from month name (0-11)
   */
  private getMonthIndex(monthName: string): number {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const normalized = monthName.toLowerCase().substring(0, 3);
    const index = months.indexOf(normalized);
    return index >= 0 ? index : 0;
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
          dayData.heartRate ||
          dayData.sleepSeconds ||
          dayData.bodyBattery;

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
          sleepSeconds: dayData.sleepSeconds,
          bodyBattery: dayData.bodyBattery,
        };

        await activitiesService.addOrUpdateActivity(activity);
        imported++;
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        console.error(`❌ Error importing ${dayData.date}:`, error);
        errors.push(`${dayData.date}: ${errorMsg}`);
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
