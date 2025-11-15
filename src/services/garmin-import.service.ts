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
  hrvOvernight?: number;
  hrv7DayAvg?: number;
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
    console.log(`🔍 Starting to parse ${files.length} file(s)`);
    const allData = new Map<string, ParsedGarminData>();

    for (const file of files) {
      try {
        const text = await file.text();
        const fileData = this.parseCSV(text, file.name);

        console.log(`✅ Parsed ${fileData.length} records from ${file.name}`);

        // Merge data by date
        for (const dayData of fileData) {
          const existing = allData.get(dayData.date) || { date: dayData.date };
          allData.set(dayData.date, { ...existing, ...dayData });
        }
      } catch (error) {
        console.error(`❌ Error parsing ${file.name}:`, error);
      }
    }

    const totalRecords = Array.from(allData.values()).length;
    console.log(`📊 Total merged records: ${totalRecords}`);

    return Array.from(allData.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Parse a single CSV file and detect its type
   */
  private parseCSV(text: string, filename: string): ParsedGarminData[] {
    const lines = text.split('\n').filter(line => line.trim());

    console.log(`📄 Parsing file: ${filename}`);

    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    // Detect type based on headers and filename
    const headers = lines[0].toLowerCase();
    const filenameLower = filename.toLowerCase();

    console.log(`📋 Headers: ${headers.substring(0, 200)}...`);

    // Check for Sleep CSV first, before Heart Rate, because Sleep CSV contains "Resting Heart Rate" column
    if (headers.includes('sleep score') || headers.includes('sleep') || headers.includes('avg duration') || headers.includes('body battery')) {
      console.log('✅ Detected: Sleep CSV');
      return this.parseSleepCSV(lines);
    } else if (headers.includes('overnight hrv') || headers.includes('7d avg')) {
      console.log('✅ Detected: HRV CSV');
      return this.parseHRVCSV(lines);
    } else if (headers.includes('active calories')) {
      console.log('✅ Detected: Calories CSV');
      return this.parseCaloriesCSV(lines);
    } else if (headers.includes('intensity minutes')) {
      console.log('✅ Detected: Intensity CSV');
      return this.parseIntensityCSV(lines);
    } else if (headers.includes('stress')) {
      console.log('✅ Detected: Stress CSV');
      return this.parseStressCSV(lines);
    } else if (headers.includes('steps') || (headers.includes('actual') && headers.includes('goal')) || filenameLower.includes('steps')) {
      console.log('✅ Detected: Steps CSV');
      return this.parseStepsCSV(lines);
    } else if (headers.includes('distance')) {
      console.log('✅ Detected: Distance CSV');
      return this.parseDistanceCSV(lines);
    } else if (headers.includes('heart rate') || headers.includes('resting hr')) {
      console.log('✅ Detected: Heart Rate CSV');
      return this.parseHeartRateCSV(lines);
    }

    // Try generic parsing as fallback
    console.log('⚠️ Unknown format, using generic parser');
    return this.parseGenericCSV(lines);
  }

  /**
   * Parse Calories CSV
   * Only accepts daily data - weekly summaries are skipped
   * - Daily: ,Active Calories,Resting Calories,Total
   *          10/31/2024,707,2143,2850
   * - Weekly (SKIPPED): ,Active Calories,Resting Calories,Total
   *                     10/31/2024,4950,15036,19986
   */
  private parseCaloriesCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    // Detect if data is weekly by checking total calories and date intervals
    let isWeeklyData = false;
    if (lines.length > 1) {
      const firstDataParts = lines[1].split(',');
      if (firstDataParts.length >= 4) {
        const totalCalories = parseFloat(firstDataParts[3]) || 0;
        // If total > 5000, it's likely weekly data (normal daily is 1500-3500)
        isWeeklyData = totalCalories > 5000;
      }
    }

    if (isWeeklyData) {
      console.warn('⚠️ Skipping weekly calories data - please download daily/monthly exports for accurate data');
      console.warn('   Tip: In Garmin Connect, download 1-month periods instead of full year for daily values');
      return result; // Return empty array - skip this file
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
          active: Math.round(active),
          resting: Math.round(resting),
          total: Math.round(total),
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
   * Parse Steps CSV
   * Format: ,Actual,Goal
   *         10/11/2025,2727,4440
   */
  private parseStepsCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    // Check headers to determine column index
    const headers = lines[0].toLowerCase();
    const hasActualColumn = headers.includes('actual');

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 2) continue;

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      // If has 'Actual' header, use column 1, otherwise assume column 1 is steps
      const stepsValue = hasActualColumn ? parts[1] : parts[1];

      result.push({
        date,
        steps: parseInt(stepsValue) || 0,
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
   * Parse Heart Rate CSV/TSV
   * Format 1 (CSV - Resting only): ,Resting Heart Rate
   *                                10/15/2025,54
   * Format 2 (CSV - With max):     ,Resting HR,Max HR
   *                                10/15/2025,54,180
   * Format 3 (TSV - Copy/paste from Garmin site):
   *                                Nov 11	55 bpm	94 bpm
   */
  private parseHeartRateCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    // Detect if this is tab-separated (copy-pasted from Garmin site)
    const isTabSeparated = lines.some(line => line.includes('\t'));

    for (let i = 1; i < lines.length; i++) {
      const parts = isTabSeparated ? lines[i].split('\t') : lines[i].split(',');
      if (parts.length < 2) continue; // Need at least date + resting HR

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      // Parse HR values - remove "bpm" suffix if present
      const restingHR = parseFloat(parts[1].replace(/\s*bpm\s*/i, '')) || 0;
      const maxHR = parts.length >= 3 ? (parseFloat(parts[2].replace(/\s*bpm\s*/i, '')) || 0) : 0;

      if (restingHR > 0) { // Only add if we have valid resting HR
        result.push({
          date,
          heartRate: {
            resting: restingHR,
            max: maxHR,
          },
        });
      }
    }

    return result;
  }

  /**
   * Parse HRV CSV (Heart Rate Variability)
   * Format (CSV): Date,Overnight HRV,Baseline,7d Avg
   *               Nov 11,42ms,35ms - 51ms,34ms
   * Format (TSV): Nov 11	42ms	35ms - 51ms	34ms
   */
  private parseHRVCSV(lines: string[]): ParsedGarminData[] {
    const result: ParsedGarminData[] = [];

    // Detect if this is tab-separated (copy-pasted from Garmin site)
    const isTabSeparated = lines.some(line => line.includes('\t'));

    for (let i = 1; i < lines.length; i++) {
      const parts = isTabSeparated ? lines[i].split('\t') : lines[i].split(',');
      if (parts.length < 2) continue; // Need at least date + overnight HRV

      const date = this.parseDate(parts[0]);
      if (!date) continue;

      // Parse HRV values - remove "ms" suffix if present
      const overnight = parseFloat(parts[1].replace(/\s*ms\s*/i, '')) || 0;
      const avg7d = parts.length >= 4 ? (parseFloat(parts[3].replace(/\s*ms\s*/i, '')) || 0) : 0;

      if (overnight > 0) { // Only add if we have valid overnight HRV
        result.push({
          date,
          hrvOvernight: overnight,
          hrv7DayAvg: avg7d > 0 ? avg7d : undefined,
        });
      }
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
      console.log('🛏️ Parsing as daily sleep format (has sleep score or body battery)');
      return this.parseSleepDailyCSV(lines);
    } else {
      console.log('🛏️ Parsing as weekly sleep format');
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

    console.log('📊 Sleep CSV columns:', {
      dateCol,
      restingHRCol,
      bodyBatteryCol,
      durationCol,
      headers: headers.slice(0, 10)
    });

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 2) continue;

      // Parse date (already in YYYY-MM-DD format)
      const date = this.parseDate(parts[dateCol]);
      if (!date) {
        console.warn('Could not parse date from:', parts[dateCol]);
        continue;
      }

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
        if (i <= 3) { // Log first 3 rows for debugging
          console.log(`Sleep row ${i}:`, {
            date: data.date,
            duration: parts[durationCol],
            sleepSeconds: data.sleepSeconds,
            bodyBattery: parts[bodyBatteryCol],
            parsedBB: data.bodyBattery,
            restingHR: parts[restingHRCol],
            parsedHR: data.heartRate?.resting
          });
        }
        result.push(data);
      }
    }

    console.log(`✅ Parsed ${result.length} sleep records`);
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
   * Supports: MM/DD/YYYY, YYYY-MM-DD, "Nov 11" (from copy-paste), etc.
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

      // Try "Nov 11" format (from Garmin website copy-paste)
      const monthDayMatch = dateStr.match(/^([A-Za-z]+)\s+(\d+)$/);
      if (monthDayMatch) {
        const monthName = monthDayMatch[1];
        const day = monthDayMatch[2];

        // Determine year (current year, or previous if month is in future)
        const currentDate = new Date();
        let year = currentDate.getFullYear();
        const monthIndex = this.getMonthIndex(monthName);

        // If the month hasn't occurred yet this year, use previous year
        if (monthIndex > currentDate.getMonth()) {
          year--;
        }

        return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
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
          dayData.bodyBattery ||
          dayData.hrvOvernight ||
          dayData.hrv7DayAvg;

        if (!hasData) {
          continue; // Skip empty days
        }

        // Build activity object with only fields that have data
        // This prevents overwriting existing data with zeros/undefined
        const activity: Partial<Omit<DailyActivity, 'id' | 'created_at' | 'updated_at'>> & { date: string } = {
          date: dayData.date,
        };

        // Only add calorie fields if we have calorie data
        if (dayData.calories) {
          activity.totalCalories = dayData.calories.total || 0;
          activity.activeCalories = dayData.calories.active || 0;
          activity.restingCalories = dayData.calories.resting || 0;
        }

        // Only add steps if we have steps data
        if (dayData.steps && dayData.steps > 0) {
          activity.steps = dayData.steps;
        }

        // Only add other fields if they have data (> 0 to avoid overwriting with zeros)
        // Exception: intensityMinutes can be 0 (valid value), so only check for undefined
        if (dayData.intensityMinutes !== undefined) {
          activity.intensityMinutes = dayData.intensityMinutes;
        }
        if (dayData.distance !== undefined && dayData.distance > 0) {
          activity.distanceMeters = dayData.distance;
        }
        if (dayData.stress !== undefined && dayData.stress > 0) {
          activity.stressLevel = dayData.stress;
        }
        if (dayData.heartRate?.resting !== undefined && dayData.heartRate.resting > 0) {
          activity.heartRateResting = dayData.heartRate.resting;
        }
        if (dayData.heartRate?.max !== undefined && dayData.heartRate.max > 0) {
          activity.heartRateMax = dayData.heartRate.max;
        }
        if (dayData.sleepSeconds !== undefined && dayData.sleepSeconds > 0) {
          activity.sleepSeconds = dayData.sleepSeconds;
        }
        if (dayData.bodyBattery !== undefined && dayData.bodyBattery > 0) {
          activity.bodyBattery = dayData.bodyBattery;
        }
        if (dayData.hrvOvernight !== undefined && dayData.hrvOvernight > 0) {
          activity.hrvOvernight = dayData.hrvOvernight;
        }
        if (dayData.hrv7DayAvg !== undefined && dayData.hrv7DayAvg > 0) {
          activity.hrv7DayAvg = dayData.hrv7DayAvg;
        }

        await activitiesService.addOrUpdateActivity(activity as Omit<DailyActivity, 'id' | 'created_at' | 'updated_at'>);
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
