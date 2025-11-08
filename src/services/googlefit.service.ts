/**
 * Google Fit Service
 *
 * OAuth 2.0 authentication en API calls naar Google Fit
 * Aggregeert fitness data van alle connected devices (Garmin, Fitbit, etc.)
 *
 * Documentation: https://developers.google.com/fit/rest
 */

import type { DailyActivity, GarminActivity } from '@/types';
import { activitiesService } from './activities.service';

// Google Fit API configuration
const GOOGLE_FIT_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  scope: [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
  ].join(' '),
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest'],
};

// Google Fit data type names
const DATA_TYPES = {
  CALORIES_EXPENDED: 'com.google.calories.expended',
  CALORIES_BMR: 'com.google.calories.bmr',
  ACTIVE_MINUTES: 'com.google.active_minutes',
  STEP_COUNT: 'com.google.step_count.delta',
  DISTANCE: 'com.google.distance.delta',
  HEART_RATE: 'com.google.heart_rate.bpm',
  WEIGHT: 'com.google.weight',
  HEIGHT: 'com.google.height',
  SLEEP: 'com.google.sleep.segment',
  ACTIVITY_SEGMENT: 'com.google.activity.segment',
  FLOORS: 'com.google.floors',
};

class GoogleFitService {
  private gapi: any = null;
  private tokenClient: any = null;
  private readonly LAST_SYNC_KEY = 'googlefit_last_sync_date';

  /**
   * Initialize Google API client
   */
  async initialize(): Promise<void> {
    try {
      // Load Google API client library
      await this.loadGapiScript();

      // Initialize gapi client
      await this.initializeGapiClient();

      // Initialize token client for OAuth 2.0
      await this.initializeTokenClient();

      console.log('✅ Google Fit API initialized');
    } catch (error) {
      console.error('❌ Error initializing Google Fit API:', error);
      throw error;
    }
  }

  /**
   * Load Google API client script
   */
  private async loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).gapi) {
        this.gapi = (window as any).gapi;
        resolve();
        return;
      }

      // Load script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.gapi = (window as any).gapi;
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /**
   * Initialize GAPI client
   */
  private async initializeGapiClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gapi.load('client', async () => {
        try {
          await this.gapi.client.init({
            apiKey: GOOGLE_FIT_CONFIG.apiKey,
            discoveryDocs: GOOGLE_FIT_CONFIG.discoveryDocs,
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Initialize Google Identity Services token client
   */
  private async initializeTokenClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load GIS script if not already loaded
      if (!(window as any).google?.accounts) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          this.createTokenClient();
          resolve();
        };
        script.onerror = reject;
        document.body.appendChild(script);
      } else {
        this.createTokenClient();
        resolve();
      }
    });
  }

  /**
   * Create token client for OAuth
   */
  private createTokenClient(): void {
    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_FIT_CONFIG.clientId,
      scope: GOOGLE_FIT_CONFIG.scope,
      callback: '', // Will be set during sign-in
    });
  }

  /**
   * Sign in to Google Fit
   */
  async signIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = async (response: any) => {
          if (response.error !== undefined) {
            reject(response);
            return;
          }

          console.log('✅ Google Fit signed in');

          // Dispatch event for UI updates
          window.dispatchEvent(new CustomEvent('googlefit-connected'));

          resolve();
        };

        // Prompt for consent if needed
        if (this.gapi.client.getToken() === null) {
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          this.tokenClient.requestAccessToken({ prompt: '' });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sign out from Google Fit
   */
  signOut(): void {
    const token = this.gapi.client.getToken();
    if (token !== null) {
      (window as any).google.accounts.oauth2.revoke(token.access_token);
      this.gapi.client.setToken('');
    }

    localStorage.removeItem(this.LAST_SYNC_KEY);
    console.log('✅ Google Fit signed out');

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('googlefit-disconnected'));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.gapi?.client?.getToken() !== null;
  }

  /**
   * Sync activities from Google Fit for a specific date range
   *
   * @param startDate - YYYY-MM-DD format
   * @param endDate - YYYY-MM-DD format
   */
  async syncActivities(startDate: string, endDate: string): Promise<number> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Fit. Please sign in first.');
    }

    console.log(`📥 Syncing Google Fit data from ${startDate} to ${endDate}...`);

    try {
      const activities: DailyActivity[] = [];

      // Convert dates to timestamps (start of day, end of day)
      const startMs = new Date(startDate).getTime();
      const endMs = new Date(endDate).setHours(23, 59, 59, 999);

      // Fetch aggregated data for the date range
      const aggregatedData = await this.fetchAggregatedData(startMs, endMs);

      // Process each day
      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayStartMs = new Date(dateStr).getTime();
        const dayEndMs = new Date(dateStr).setHours(23, 59, 59, 999);

        const dayData = this.extractDayData(aggregatedData, dayStartMs, dayEndMs);

        if (dayData) {
          const activity: Omit<DailyActivity, 'id' | 'created_at' | 'updated_at'> = {
            date: dateStr,
            totalCalories: dayData.totalCalories,
            activeCalories: dayData.activeCalories,
            restingCalories: dayData.restingCalories,
            steps: dayData.steps,
            intensityMinutes: dayData.intensityMinutes,
            distanceMeters: dayData.distanceMeters,
            heartRateResting: dayData.heartRateResting,
            heartRateMax: dayData.heartRateMax,
            sleepSeconds: dayData.sleepSeconds,
          };

          // Store in database
          await activitiesService.addOrUpdateActivity(activity);
          activities.push(activity as DailyActivity);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Update last sync date
      localStorage.setItem(this.LAST_SYNC_KEY, endDate);

      console.log(`✅ Synced ${activities.length} days of Google Fit data`);

      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('googlefit-synced'));

      return activities.length;
    } catch (error) {
      console.error('❌ Error syncing Google Fit data:', error);
      throw error;
    }
  }

  /**
   * Fetch aggregated data from Google Fit
   */
  private async fetchAggregatedData(startTimeMs: number, endTimeMs: number): Promise<any> {
    const request = {
      aggregateBy: [
        { dataTypeName: DATA_TYPES.CALORIES_EXPENDED },
        { dataTypeName: DATA_TYPES.CALORIES_BMR },
        { dataTypeName: DATA_TYPES.STEP_COUNT },
        { dataTypeName: DATA_TYPES.DISTANCE },
        { dataTypeName: DATA_TYPES.ACTIVE_MINUTES },
        { dataTypeName: DATA_TYPES.HEART_RATE },
        { dataTypeName: DATA_TYPES.SLEEP },
      ],
      bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
      startTimeMillis: startTimeMs,
      endTimeMillis: endTimeMs,
    };

    const response = await this.gapi.client.fitness.users.dataset.aggregate({
      userId: 'me',
      resource: request,
    });

    return response.result;
  }

  /**
   * Extract data for a specific day from aggregated data
   */
  private extractDayData(aggregatedData: any, dayStartMs: number, dayEndMs: number): any | null {
    const bucket = aggregatedData.bucket?.find((b: any) => {
      const bucketStart = parseInt(b.startTimeMillis);
      const bucketEnd = parseInt(b.endTimeMillis);
      return bucketStart >= dayStartMs && bucketEnd <= dayEndMs + 1000; // Allow 1s margin
    });

    if (!bucket) return null;

    const data: any = {
      totalCalories: 0,
      activeCalories: 0,
      restingCalories: 0,
      steps: 0,
      intensityMinutes: 0,
      distanceMeters: 0,
      heartRateResting: undefined,
      heartRateMax: undefined,
      sleepSeconds: 0,
    };

    // Process each dataset in the bucket
    for (const dataset of bucket.dataset || []) {
      const dataTypeName = dataset.dataSourceId?.split(':')[0];

      for (const point of dataset.point || []) {
        const value = point.value?.[0];

        switch (dataTypeName) {
          case DATA_TYPES.CALORIES_EXPENDED:
            data.totalCalories += value?.fpVal || 0;
            break;
          case DATA_TYPES.CALORIES_BMR:
            data.restingCalories += value?.fpVal || 0;
            break;
          case DATA_TYPES.STEP_COUNT:
            data.steps += value?.intVal || 0;
            break;
          case DATA_TYPES.DISTANCE:
            data.distanceMeters += value?.fpVal || 0;
            break;
          case DATA_TYPES.ACTIVE_MINUTES:
            data.intensityMinutes += value?.intVal || 0;
            break;
          case DATA_TYPES.HEART_RATE:
            const hr = value?.fpVal || 0;
            if (hr > 0) {
              if (!data.heartRateMax || hr > data.heartRateMax) {
                data.heartRateMax = hr;
              }
              if (!data.heartRateResting || hr < data.heartRateResting) {
                data.heartRateResting = hr;
              }
            }
            break;
          case DATA_TYPES.SLEEP:
            // Sleep segments: value indicates sleep type
            const sleepType = value?.intVal;
            const duration = (parseInt(point.endTimeNanos) - parseInt(point.startTimeNanos)) / 1000000000;
            if (sleepType && sleepType > 0) { // Exclude awake periods
              data.sleepSeconds += duration;
            }
            break;
        }
      }
    }

    // Calculate active calories (total - resting)
    data.activeCalories = Math.max(0, data.totalCalories - data.restingCalories);

    return data;
  }

  /**
   * Auto-sync: Sync yesterday's data (safe to call daily)
   */
  async autoSync(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return await this.syncActivities(yesterdayStr, yesterdayStr);
  }

  /**
   * Sync recent data (last 7 days)
   */
  async syncRecentData(): Promise<number> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Yesterday
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6); // 7 days total

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return await this.syncActivities(startDateStr, endDateStr);
  }

  /**
   * Get last sync date
   */
  getLastSyncDate(): string | null {
    return localStorage.getItem(this.LAST_SYNC_KEY);
  }
}

// Export singleton instance
export const googleFitService = new GoogleFitService();
export default googleFitService;
