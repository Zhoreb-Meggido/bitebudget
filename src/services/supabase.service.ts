/**
 * Supabase Client Service
 * Handles OAuth token management via Supabase Edge Functions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private userId: string | null = null;
  private readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
  private readonly SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  /**
   * Initialize Supabase client
   */
  initialize(): void {
    if (this.client) return;

    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase credentials not configured. Automatic OAuth refresh will be disabled.');
      return;
    }

    this.client = createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');
  }

  /**
   * Check if Supabase is configured and available
   */
  isAvailable(): boolean {
    return !!this.client;
  }

  /**
   * Get or generate user ID (browser fingerprint)
   * This is used to identify users without requiring authentication
   */
  async getUserId(): Promise<string> {
    if (this.userId) return this.userId;

    // Check if we have a stored user ID
    let storedUserId = localStorage.getItem('supabase_user_id');

    if (!storedUserId) {
      // Generate a unique browser fingerprint
      storedUserId = await this.generateBrowserFingerprint();
      localStorage.setItem('supabase_user_id', storedUserId);
      console.log('🆔 Generated new user ID:', storedUserId.substring(0, 8) + '...');
    }

    this.userId = storedUserId;
    return this.userId;
  }

  /**
   * Generate a browser fingerprint based on various browser characteristics
   * This creates a unique identifier for the user without requiring login
   */
  private async generateBrowserFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.hardwareConcurrency || 0,
      navigator.maxTouchPoints || 0,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      !!window.indexedDB,
    ];

    // Add canvas fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f00';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#0f0';
      ctx.fillText('BiteBudget', 2, 2);
      components.push(canvas.toDataURL());
    }

    // Combine all components and hash
    const fingerprint = components.join('|');
    const hash = await this.hashString(fingerprint);

    return hash;
  }

  /**
   * Hash a string using SHA-256
   */
  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Call Supabase Edge Function
   */
  private async callFunction(functionName: string, body: any): Promise<any> {
    if (!this.client) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.client.functions.invoke(functionName, {
      body,
    });

    if (error) {
      console.error(`❌ Error calling ${functionName}:`, error);
      throw error;
    }

    // Check if data contains an error (Edge Function returned error response)
    if (data && typeof data === 'object' && 'error' in data) {
      console.error(`❌ ${functionName} returned error:`, data);
      throw new Error(data.error || 'Unknown error from Edge Function');
    }

    return data;
  }

  /**
   * Initialize Google OAuth (exchange authorization code for tokens)
   */
  async initGoogleOAuth(code: string, redirectUri: string, codeVerifier: string): Promise<{ access_token: string; expires_in: number; expires_at: string }> {
    const userId = await this.getUserId();

    return await this.callFunction('google-oauth-init', {
      code,
      redirectUri,
      codeVerifier,
      userId,
    });
  }

  /**
   * Refresh Google access token
   */
  async refreshGoogleToken(): Promise<{ access_token: string; expires_in: number; expires_at: string }> {
    const userId = await this.getUserId();

    return await this.callFunction('google-oauth-refresh', {
      userId,
    });
  }

  /**
   * Initialize Garmin OAuth (exchange authorization code for tokens)
   */
  async initGarminOAuth(code: string, codeVerifier: string, redirectUri: string): Promise<{ access_token: string; expires_in: number; expires_at: string }> {
    const userId = await this.getUserId();

    return await this.callFunction('garmin-oauth-init', {
      code,
      codeVerifier,
      redirectUri,
      userId,
    });
  }

  /**
   * Refresh Garmin access token
   */
  async refreshGarminToken(): Promise<{ access_token: string; expires_in: number; expires_at: string }> {
    const userId = await this.getUserId();

    return await this.callFunction('garmin-oauth-refresh', {
      userId,
    });
  }
}

export const supabaseService = new SupabaseService();
