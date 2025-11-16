/**
 * Google Drive Service - OAuth + file upload/download
 * Now with Authorization Code Flow and automatic token refresh via Supabase!
 */

import { supabaseService } from './supabase.service';
import { settingsService } from './settings.service';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '413904583159-t6fgs0dn819dtla2oqdu8dni0sibtujo.apps.googleusercontent.com';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

class GoogleDriveService {
  private readonly CLIENT_ID = GOOGLE_CLIENT_ID;
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';
  private readonly FOLDER_NAME = 'BiteBudget';
  private readonly FILE_NAME = 'bitebudget-data.enc';
  // Include base path for GitHub Pages deployment (e.g., /bitebudget/)
  private readonly REDIRECT_URI = `${window.location.origin}${import.meta.env.BASE_URL}oauth/google/callback`;

  private accessToken: string | null = null;
  private refreshInProgress: boolean = false;
  private refreshPromise: Promise<void> | null = null; // Shared promise for concurrent refresh requests
  private automaticRefreshInterval: number | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Initialize Supabase
    supabaseService.initialize();

    // Start initialization process (with token refresh if needed)
    this.initializationPromise = this.initialize();
  }

  /**
   * Initialize service and handle token refresh on startup
   */
  private async initialize(): Promise<void> {
    // Start automatic refresh timer if enabled and token exists
    if (this.isSignedIn()) {
      this.startAutomaticRefreshTimer();
    } else {
      // Token expired but we might be able to refresh automatically
      // Try silent refresh on startup if using authorization code flow
      await this.tryAutoRefreshOnStartup();
    }

    // Initialization complete
    this.initializationPromise = null;
  }

  /**
   * Try to automatically refresh token on startup if expired
   * Prevents popup if we can silently refresh via Supabase
   */
  private async tryAutoRefreshOnStartup(): Promise<void> {
    const method = localStorage.getItem('google_oauth_method');
    if (method !== 'authorization_code') {
      console.log('ℹ️ Skipping auto-refresh: not using authorization code flow');
      return;
    }
    if (!supabaseService.isAvailable()) {
      console.log('ℹ️ Skipping auto-refresh: Supabase not available');
      return;
    }

    // Check if token is expired
    const expiresAt = localStorage.getItem('google_token_expires_at');
    if (!expiresAt) {
      console.log('ℹ️ Skipping auto-refresh: no expiry timestamp found');
      return;
    }

    const expiryTime = parseInt(expiresAt);
    const now = Date.now();

    // Only auto-refresh if:
    // 1. Token is expired (or expires within 5 minutes)
    // 2. Token expired less than 7 days ago (assume refresh token is still valid)
    const isExpired = now > expiryTime - (5 * 60 * 1000);
    const expiredMs = now - expiryTime;
    const maxRefreshAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (!isExpired) {
      console.log('ℹ️ Token still valid, no refresh needed');
      return;
    }

    if (expiredMs > maxRefreshAge) {
      console.warn(`⚠️ Token expired ${Math.floor(expiredMs / (24 * 60 * 60 * 1000))} days ago, refresh token may be expired. User needs to re-authenticate.`);
      return;
    }

    try {
      const hoursExpired = Math.floor(expiredMs / (60 * 60 * 1000));
      const minutesExpired = Math.floor((expiredMs % (60 * 60 * 1000)) / (60 * 1000));
      console.log(`🔄 Token expired ${hoursExpired}h ${minutesExpired}m ago, attempting automatic refresh on startup...`);

      await this.automaticRefresh();

      // Success! Start the timer
      this.startAutomaticRefreshTimer();
      console.log('✅ Startup auto-refresh successful!');
    } catch (error: any) {
      console.error('❌ Startup auto-refresh failed:', error);
      console.error('   Error type:', error?.constructor?.name);
      console.error('   Error message:', error?.message);

      // Check if this is a "no refresh token" error
      if (error?.message?.includes('No refresh token found')) {
        console.error('   💡 Refresh token missing from database - user needs to re-authenticate');
      } else if (error?.message?.includes('expired or revoked')) {
        console.error('   💡 Refresh token expired/revoked - user needs to re-authenticate');
      } else {
        console.error('   💡 Unknown error - may be network issue or Supabase problem');
      }

      // Don't throw - let the app continue, sync will show modal when needed
    }
  }

  /**
   * Sign in to Google using Authorization Code Flow
   * This flow provides refresh tokens when using a backend (Supabase Edge Functions)
   */
  async signIn(): Promise<void> {
    // Check if user wants automatic refresh
    const settings = await settingsService.loadSettings();
    const useAutomaticRefresh = settings.autoRefreshOAuth !== false && supabaseService.isAvailable();

    if (useAutomaticRefresh) {
      // Use Authorization Code Flow (gets refresh token via Supabase)
      await this.signInWithAuthorizationCodeFlow();
    } else {
      // Fallback to Implicit Flow (no refresh token, shows modal when expired)
      await this.signInWithImplicitFlow();
    }
  }

  /**
   * Authorization Code Flow (RECOMMENDED - provides automatic refresh)
   * Redirects user to Google consent screen, then exchanges code for tokens via Supabase
   */
  private async signInWithAuthorizationCodeFlow(): Promise<void> {
    // Generate code verifier and challenge for PKCE (optional security enhancement)
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store code verifier for callback (use localStorage to survive page reload)
    localStorage.setItem('google_code_verifier', codeVerifier);

    // Build authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', this.CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', this.REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.SCOPES);
    authUrl.searchParams.set('access_type', 'offline'); // Request refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to ensure refresh token
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Redirect to Google
    window.location.href = authUrl.toString();
  }

  /**
   * Handle OAuth callback (called after user authorizes)
   */
  async handleOAuthCallback(code: string): Promise<void> {
    try {
      console.log('📥 Handling OAuth callback...');

      // Retrieve code verifier from local storage (for PKCE)
      const codeVerifier = localStorage.getItem('google_code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier not found in local storage');
      }

      console.log('🔄 Exchanging authorization code for tokens...');
      console.log('📍 Redirect URI:', this.REDIRECT_URI);

      // Exchange authorization code for tokens via Supabase Edge Function
      const { access_token, expires_in, expires_at } = await supabaseService.initGoogleOAuth(
        code,
        this.REDIRECT_URI,
        codeVerifier
      );

      // Clean up code verifier
      localStorage.removeItem('google_code_verifier');

      // Store access token and expiry
      this.accessToken = access_token;
      localStorage.setItem('google_access_token', access_token);
      localStorage.setItem('google_token_expires_at', new Date(expires_at).getTime().toString());
      localStorage.setItem('google_oauth_method', 'authorization_code'); // Mark as automatic refresh enabled

      console.log('✅ OAuth initialization complete, automatic refresh enabled!');

      // Start automatic refresh timer
      this.startAutomaticRefreshTimer();

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('google-oauth-success'));

    } catch (error) {
      console.error('❌ OAuth callback failed:', error);
      console.error('💡 Tip: If you see "invalid_grant" error, make sure your redirect URI is configured in Google Cloud Console:');
      console.error('   Development: http://localhost:3000/oauth/google/callback');
      console.error('   Production: https://zhoreb-meggido.github.io/bitebudget/oauth/google/callback');
      throw error;
    }
  }

  /**
   * Implicit Flow (FALLBACK - no automatic refresh, requires manual re-auth)
   */
  private async signInWithImplicitFlow(): Promise<void> {
    await this.initializeGIS();

    return new Promise((resolve, reject) => {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES,
          callback: (response: GoogleTokenResponse) => {
            if (response.access_token) {
              this.accessToken = response.access_token;
              localStorage.setItem('google_access_token', response.access_token);

              // Store expiry time
              const expiresAt = Date.now() + (response.expires_in * 1000);
              localStorage.setItem('google_token_expires_at', expiresAt.toString());
              localStorage.setItem('google_oauth_method', 'implicit'); // Mark as manual refresh only

              console.log('✅ Signed in with Implicit Flow (manual refresh mode)');
              resolve();
            } else {
              reject(new Error('No access token received'));
            }
          },
          error_callback: (error: any) => {
            reject(new Error(`OAuth error: ${error.message || 'Unknown error'}`));
          },
        });

        tokenClient.requestAccessToken();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initialize Google Identity Services (for Implicit Flow fallback)
   */
  private async initializeGIS(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Start automatic refresh timer (refreshes token every 50 minutes)
   */
  private startAutomaticRefreshTimer(): void {
    // Only start if using authorization code flow
    const method = localStorage.getItem('google_oauth_method');
    if (method !== 'authorization_code' || !supabaseService.isAvailable()) {
      return;
    }

    // Clear existing interval
    if (this.automaticRefreshInterval) {
      clearInterval(this.automaticRefreshInterval);
    }

    // Refresh every 50 minutes (tokens expire after 60 minutes)
    this.automaticRefreshInterval = window.setInterval(async () => {
      try {
        await this.automaticRefresh();
      } catch (error) {
        console.error('Automatic refresh failed:', error);
      }
    }, 50 * 60 * 1000); // 50 minutes

    console.log('⏰ Automatic token refresh enabled (every 50 minutes)');
  }

  /**
   * Automatically refresh token via Supabase Edge Function
   */
  private async automaticRefresh(): Promise<void> {
    // If refresh is already in progress, wait for it to complete
    if (this.refreshInProgress && this.refreshPromise) {
      console.log('🔄 Refresh already in progress, waiting for it to complete...');
      await this.refreshPromise;
      return;
    }

    // Start new refresh
    this.refreshInProgress = true;

    // Create a new promise that all concurrent callers will wait for
    this.refreshPromise = (async () => {
      try {
        console.log('🔄 Automatically refreshing Google token...');

        const { access_token, expires_at } = await supabaseService.refreshGoogleToken();

        this.accessToken = access_token;
        localStorage.setItem('google_access_token', access_token);
        localStorage.setItem('google_token_expires_at', new Date(expires_at).getTime().toString());

        console.log('✅ Token automatically refreshed!');

        // Dispatch event to notify UI
        window.dispatchEvent(new CustomEvent('google-token-refreshed'));

      } catch (error: any) {
        console.error('❌ Automatic refresh failed:', error);

        // Check if refresh token is expired/revoked (401/404 from Supabase)
        const errorMessage = error?.message || '';
        if (errorMessage.includes('expired') || errorMessage.includes('revoked') || errorMessage.includes('not found')) {
          console.warn('⚠️ Refresh token expired or revoked - user needs to re-authenticate');

          // Clear OAuth state to force re-login
          this.accessToken = null;
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_token_expires_at');
          localStorage.removeItem('google_oauth_method');

          // Stop automatic refresh timer
          if (this.automaticRefreshInterval) {
            clearInterval(this.automaticRefreshInterval);
            this.automaticRefreshInterval = null;
          }
        }

        // Dispatch expiry warning to show modal
        window.dispatchEvent(new CustomEvent('google-drive-token-expired'));

        throw error;
      } finally {
        this.refreshInProgress = false;
        this.refreshPromise = null;
      }
    })();

    // Wait for the refresh to complete
    await this.refreshPromise;
  }

  /**
   * Manually refresh token (fallback for Implicit Flow or if automatic fails)
   * Requires user interaction - shows consent screen
   */
  async manualRefresh(): Promise<boolean> {
    // Prevent concurrent refresh attempts
    if (this.refreshInProgress) {
      console.log('🔄 Token refresh already in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return !this.isTokenExpired(0);
    }

    this.refreshInProgress = true;

    try {
      // If we have Supabase and authorization code flow, try automatic refresh first
      const method = localStorage.getItem('google_oauth_method');
      if (method === 'authorization_code' && supabaseService.isAvailable()) {
        try {
          await this.automaticRefresh();
          return true;
        } catch (error) {
          console.warn('Automatic refresh failed, falling back to manual:', error);
          // Fall through to manual refresh
        }
      }

      // Manual refresh via Implicit Flow
      await this.initializeGIS();

      return new Promise((resolve) => {
        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: this.CLIENT_ID,
            scope: this.SCOPES,
            callback: (response: GoogleTokenResponse) => {
              if (response.access_token) {
                console.log('✅ Token refreshed manually');
                this.accessToken = response.access_token;
                localStorage.setItem('google_access_token', response.access_token);

                const expiresAt = Date.now() + (response.expires_in * 1000);
                localStorage.setItem('google_token_expires_at', expiresAt.toString());

                this.refreshInProgress = false;

                // Dispatch event to notify UI
                window.dispatchEvent(new CustomEvent('google-token-refreshed'));

                resolve(true);
              } else {
                console.log('❌ Manual refresh failed: no access token');
                this.refreshInProgress = false;
                resolve(false);
              }
            },
            error_callback: (error: any) => {
              console.log('❌ Manual refresh failed:', error);
              this.refreshInProgress = false;
              resolve(false);
            },
          });

          client.requestAccessToken();
        } catch (error) {
          console.error('❌ Error during manual refresh:', error);
          this.refreshInProgress = false;
          resolve(false);
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize for manual refresh:', error);
      this.refreshInProgress = false;
      return false;
    }
  }

  /**
   * Sign out and revoke token
   */
  async signOut(): Promise<void> {
    // Clear automatic refresh timer
    if (this.automaticRefreshInterval) {
      clearInterval(this.automaticRefreshInterval);
      this.automaticRefreshInterval = null;
    }

    const token = this.getAccessToken();
    if (token) {
      try {
        const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST',
        });

        // 400 errors are expected for expired/already-revoked tokens - ignore them
        if (!response.ok && response.status !== 400) {
          console.warn('Token revocation returned non-OK status:', response.status);
        }
      } catch (error) {
        // Network errors - log but continue cleanup
        console.error('Failed to revoke token:', error);
      }
    }

    this.accessToken = null;
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires_at');
    localStorage.removeItem('google_oauth_method');
  }

  /**
   * Check if token is expired or will expire soon
   */
  private isTokenExpired(bufferMinutes: number = 0): boolean {
    const expiresAt = localStorage.getItem('google_token_expires_at');
    if (!expiresAt) return true;

    const expiryTime = parseInt(expiresAt);
    const bufferMs = bufferMinutes * 60 * 1000;
    return Date.now() + bufferMs > expiryTime;
  }

  /**
   * Get time remaining until token expires (in minutes)
   */
  getTokenExpiryMinutes(): number {
    const expiresAt = localStorage.getItem('google_token_expires_at');
    if (!expiresAt) return 0;

    const expiryTime = parseInt(expiresAt);
    const remainingMs = expiryTime - Date.now();
    return Math.floor(remainingMs / 60000); // Convert to minutes
  }

  /**
   * Check if token needs user attention (expires within warning threshold)
   */
  needsReauthentication(warningMinutes: number = 10): boolean {
    const remainingMinutes = this.getTokenExpiryMinutes();
    return remainingMinutes <= warningMinutes && remainingMinutes > 0;
  }

  /**
   * Ensure we have a valid token (with automatic refresh if available)
   */
  async ensureValidToken(): Promise<boolean> {
    // Wait for initialization to complete (includes startup token refresh)
    if (this.initializationPromise) {
      console.log('⏳ Waiting for service initialization to complete...');
      await this.initializationPromise;
    }

    // If refresh is already in progress, wait for it to complete
    if (this.refreshInProgress && this.refreshPromise) {
      console.log('⏳ Waiting for ongoing token refresh to complete...');
      try {
        await this.refreshPromise;
        return true; // Refresh succeeded
      } catch (error) {
        console.error('⚠️ Ongoing refresh failed:', error);
        return false;
      }
    }

    const token = this.getAccessToken();
    if (!token) {
      console.log('⚠️ No token available, user needs to sign in');
      return false;
    }

    // Check if token is expired or will expire very soon (within 2 minutes)
    // Using a 2-minute buffer to prevent race conditions where token expires during API call
    if (this.isTokenExpired(2)) {
      console.log('⚠️ Token expired or expiring soon, attempting refresh...');

      // Try automatic refresh if available
      const method = localStorage.getItem('google_oauth_method');
      if (method === 'authorization_code' && supabaseService.isAvailable()) {
        try {
          await this.automaticRefresh();
          return true;
        } catch (error) {
          console.error('Automatic refresh failed:', error);
          // Fall through to dispatch expiry event
        }
      }

      // Dispatch event to notify UI
      window.dispatchEvent(new CustomEvent('google-drive-token-expired'));
      return false;
    }

    // Check if token will expire soon (within 10 minutes) - only for manual refresh mode
    const method = localStorage.getItem('google_oauth_method');
    if (method === 'implicit' && this.needsReauthentication(10) && document.visibilityState === 'visible') {
      const remainingMinutes = this.getTokenExpiryMinutes();
      console.log(`⚠️ Token expires in ${remainingMinutes} minutes (manual refresh mode)`);

      // Dispatch event to warn user (only if page is visible and not using automatic refresh)
      window.dispatchEvent(new CustomEvent('google-drive-token-expiring', {
        detail: { minutesRemaining: remainingMinutes }
      }));
    }

    return true;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired (no buffer)
    if (this.isTokenExpired(0)) {
      return false;
    }

    return true;
  }

  /**
   * Check if automatic refresh is enabled
   */
  isAutomaticRefreshEnabled(): boolean {
    const method = localStorage.getItem('google_oauth_method');
    return method === 'authorization_code' && supabaseService.isAvailable();
  }

  /**
   * Check if initialization is in progress (including auto-refresh on startup)
   */
  isInitializing(): boolean {
    return this.initializationPromise !== null;
  }

  /**
   * Wait for initialization to complete
   * This includes auto-refresh on startup if token was expired
   */
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Get access token
   */
  private getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;

    const stored = localStorage.getItem('google_access_token');
    if (stored) {
      this.accessToken = stored;
      return stored;
    }

    return null;
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Find or create BiteBudget folder
   */
  private async findOrCreateFolder(): Promise<string> {
    // Ensure token is valid before making API call
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Get fresh token after validation
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    // Search for existing folder
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!searchResponse.ok && searchResponse.status === 401) {
      throw new Error('Authentication failed - token may have expired during request');
    }

    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Ensure token is still valid before creating folder (in case search took long)
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }
    const freshToken = this.getAccessToken();
    if (!freshToken) throw new Error('Not authenticated');

    // Create new folder
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${freshToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: this.FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createResponse.ok && createResponse.status === 401) {
      throw new Error('Authentication failed - token may have expired during request');
    }

    const createData = await createResponse.json();
    return createData.id;
  }

  /**
   * Find existing backup file
   */
  private async findFile(folderId: string): Promise<string | null> {
    // Ensure token is valid before making API call
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Get fresh token after validation
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${this.FILE_NAME}' and '${folderId}' in parents and trashed=false`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok && response.status === 401) {
      throw new Error('Authentication failed - token may have expired during request');
    }

    const data = await response.json();

    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    return null;
  }

  /**
   * Upload encrypted data to Google Drive
   */
  async uploadData(encryptedData: string): Promise<void> {
    // Ensure token is valid at the start
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Find/create folder (has its own token validation)
    const folderId = await this.findOrCreateFolder();
    const existingFileId = await this.findFile(folderId);

    // Ensure token is still valid before upload (in case folder/file operations took long)
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Get fresh token right before upload
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const metadata = {
      name: this.FILE_NAME,
      mimeType: 'application/octet-stream',
      ...(existingFileId ? {} : { parents: [folderId] }),
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([encryptedData], { type: 'application/octet-stream' }));

    const url = existingFileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const method = existingFileId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - token may have expired during request');
      }
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  }

  /**
   * Download encrypted data from Google Drive
   */
  async downloadData(): Promise<string | null> {
    // Ensure token is valid at the start
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Find folder and file (have their own token validation)
    const folderId = await this.findOrCreateFolder();
    const fileId = await this.findFile(folderId);

    if (!fileId) {
      return null; // No backup found
    }

    // Ensure token is still valid before download
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Get fresh token right before download
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - token may have expired during request');
      }
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Get last sync info
   */
  async getLastSyncInfo(): Promise<{ date: Date; size: number } | null> {
    // Ensure token is valid at the start
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Find folder and file (have their own token validation)
    const folderId = await this.findOrCreateFolder();
    const fileId = await this.findFile(folderId);

    if (!fileId) return null;

    // Ensure token is still valid before fetching metadata
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Get fresh token right before API call
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=modifiedTime,size`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - token may have expired during request');
      }
      throw new Error(`Failed to get sync info: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      date: new Date(data.modifiedTime),
      size: parseInt(data.size),
    };
  }

  /**
   * Download backup file to disk (encrypted)
   * Downloads the encrypted backup file and triggers browser download
   */
  async downloadBackupFile(): Promise<void> {
    // Ensure token is valid at the start
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Find folder and file (have their own token validation)
    const folderId = await this.findOrCreateFolder();
    const fileId = await this.findFile(folderId);

    if (!fileId) {
      throw new Error('No backup found in Google Drive');
    }

    // Get file metadata for filename and date
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const metadataResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=modifiedTime`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!metadataResponse.ok) {
      throw new Error('Failed to get file metadata');
    }

    const metadata = await metadataResponse.json();
    const modifiedDate = new Date(metadata.modifiedTime);

    // Download encrypted file content
    const encryptedData = await this.downloadData();

    if (!encryptedData) {
      throw new Error('Failed to download backup data');
    }

    // Create filename with timestamp
    const timestamp = modifiedDate.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `bitebudget-backup-${timestamp}.enc`;

    // Trigger browser download
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Delete backup from Google Drive
   * Permanently deletes the backup file from Google Drive
   */
  async deleteBackup(): Promise<void> {
    // Ensure token is valid at the start
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Find folder and file (have their own token validation)
    const folderId = await this.findOrCreateFolder();
    const fileId = await this.findFile(folderId);

    if (!fileId) {
      throw new Error('No backup found in Google Drive');
    }

    // Ensure token is still valid before deletion
    if (!await this.ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Get fresh token right before deletion
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - token may have expired during request');
      }
      throw new Error(`Failed to delete backup: ${response.statusText}`);
    }
  }
}

export const googleDriveService = new GoogleDriveService();
