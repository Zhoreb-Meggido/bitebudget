/**
 * Garmin Connect Service
 *
 * OAuth authentication en API calls naar Garmin Connect
 *
 * IMPORTANT: Garmin uses OAuth 1.0a (not OAuth 2.0!)
 * Documentatie: https://developer.garmin.com/gc-developer-program/overview/
 */

import type { DailyActivity, GarminActivity, GarminOAuthTokens } from '@/types';
import { activitiesService } from './activities.service';

// OAuth 1.0a configuration (te configureren via developer account)
const GARMIN_CONFIG = {
  consumerKey: import.meta.env.VITE_GARMIN_CONSUMER_KEY || '',
  consumerSecret: import.meta.env.VITE_GARMIN_CONSUMER_SECRET || '',
  requestTokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
  authorizeUrl: 'https://connect.garmin.com/oauthConfirm',
  accessTokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
  apiBaseUrl: 'https://apis.garmin.com/wellness-api/rest',
};

class GarminService {
  private readonly STORAGE_KEY = 'garmin_oauth_tokens';
  private readonly LAST_SYNC_KEY = 'garmin_last_sync_date';

  /**
   * Check if user is authenticated with Garmin
   */
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    if (!tokens) return false;

    // Check if tokens are expired (if expiresAt is set)
    if (tokens.expiresAt) {
      const expiryDate = new Date(tokens.expiresAt);
      if (expiryDate < new Date()) {
        console.log('⚠️ Garmin tokens expired');
        this.clearTokens();
        return false;
      }
    }

    return true;
  }

  /**
   * Start OAuth flow (Step 1: Get request token)
   *
   * NOTE: OAuth 1.0a requires server-side component for signing requests
   * This is a placeholder - you'll need to implement a proxy endpoint
   * or use a library like oauth-1.0a
   */
  async startOAuthFlow(): Promise<void> {
    throw new Error('OAuth flow not yet implemented. See comments in garmin.service.ts');

    // TODO: Implement OAuth 1.0a flow
    // 1. Get request token from Garmin
    // 2. Redirect user to Garmin authorization page
    // 3. Handle callback with verifier
    // 4. Exchange verifier for access token
    // 5. Store tokens

    // Example flow (requires server-side signing):
    // const requestToken = await this.getRequestToken();
    // const authUrl = `${GARMIN_CONFIG.authorizeUrl}?oauth_token=${requestToken.token}`;
    // window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback (Step 3)
   */
  async handleOAuthCallback(oauthToken: string, oauthVerifier: string): Promise<void> {
    throw new Error('OAuth callback handler not yet implemented');

    // TODO: Exchange verifier for access token
    // const accessToken = await this.getAccessToken(oauthToken, oauthVerifier);
    // this.storeTokens(accessToken);
  }

  /**
   * Disconnect Garmin (revoke tokens)
   */
  disconnect(): void {
    this.clearTokens();
    localStorage.removeItem(this.LAST_SYNC_KEY);
    console.log('✅ Garmin disconnected');

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('garmin-disconnected'));
  }

  /**
   * Sync activities from Garmin for a specific date range
   *
   * @param startDate - YYYY-MM-DD format
   * @param endDate - YYYY-MM-DD format
   */
  async syncActivities(startDate: string, endDate: string): Promise<number> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Garmin. Please connect your account first.');
    }

    console.log(`📥 Syncing Garmin data from ${startDate} to ${endDate}...`);

    try {
      // TODO: Implement actual API calls
      // For now, this is a placeholder
      throw new Error('Garmin API calls not yet implemented. Need OAuth setup first.');

      /*
      // Example of what the implementation would look like:

      const activities: DailyActivity[] = [];

      // Fetch daily summaries
      const dailySummaries = await this.fetchDailySummaries(startDate, endDate);

      for (const summary of dailySummaries) {
        const activity: DailyActivity = {
          date: summary.calendarDate,
          totalCalories: summary.totalCalories || 0,
          activeCalories: summary.activeCalories || 0,
          restingCalories: summary.bmrCalories || 0,
          steps: summary.steps || 0,
          intensityMinutes: summary.moderateIntensityMinutes + summary.vigorousIntensityMinutes,
          distanceMeters: summary.distanceInMeters,
          floorsClimbed: summary.floorsClimbed,
          heartRateResting: summary.restingHeartRate,
          heartRateMax: summary.maxHeartRate,
          stressLevel: summary.averageStressLevel,
          bodyBattery: summary.bodyBatteryMostRecentValue,
          sleepSeconds: summary.sleepSeconds,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Fetch activities for this day
        const dayActivities = await this.fetchActivitiesForDate(summary.calendarDate);
        if (dayActivities.length > 0) {
          activity.activities = dayActivities;
        }

        activities.push(activity);

        // Store in database
        await activitiesService.addOrUpdateActivity(activity);
      }

      // Update last sync date
      localStorage.setItem(this.LAST_SYNC_KEY, endDate);

      console.log(`✅ Synced ${activities.length} days of Garmin data`);

      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('garmin-synced'));

      return activities.length;
      */
    } catch (error) {
      console.error('❌ Error syncing Garmin data:', error);
      throw error;
    }
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

  /**
   * Store OAuth tokens
   */
  private storeTokens(tokens: GarminOAuthTokens): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
  }

  /**
   * Get stored OAuth tokens
   */
  private getStoredTokens(): GarminOAuthTokens | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Clear OAuth tokens
   */
  private clearTokens(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Make authenticated API request to Garmin
   *
   * NOTE: OAuth 1.0a requires signing each request
   * This is a placeholder - needs proper implementation
   */
  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET'
  ): Promise<T> {
    const tokens = this.getStoredTokens();
    if (!tokens) {
      throw new Error('Not authenticated');
    }

    // TODO: Implement OAuth 1.0a request signing
    // This requires:
    // 1. Generate OAuth signature
    // 2. Add OAuth headers to request
    // 3. Make request

    throw new Error('Authenticated requests not yet implemented');
  }
}

// Export singleton instance
export const garminService = new GarminService();
export default garminService;
