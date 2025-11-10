/**
 * Garmin OAuth Token Refresh
 * Uses stored refresh token to get a new access token
 * Garmin returns a NEW refresh token with each refresh (important!)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptToken, encryptToken } from '../_shared/crypto.ts';
import { corsHeaders, handleCorsPreFlight, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface RequestBody {
  userId: string; // Browser fingerprint or user identifier
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }

  try {
    // Parse request body
    const { userId }: RequestBody = await req.json();

    if (!userId) {
      return errorResponse('Missing required field: userId');
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Retrieve encrypted refresh token from database
    console.log('Retrieving Garmin refresh token for user:', userId);
    const { data, error: dbError } = await supabase
      .from('oauth_tokens')
      .select('garmin_refresh_token_encrypted')
      .eq('user_id', userId)
      .single();

    if (dbError || !data?.garmin_refresh_token_encrypted) {
      console.error('No Garmin refresh token found for user:', userId);
      return errorResponse('No refresh token found. Please re-authenticate.', 404);
    }

    // Decrypt refresh token
    console.log('Decrypting Garmin refresh token...');
    const refreshToken = await decryptToken(data.garmin_refresh_token_encrypted);

    // Get Garmin OAuth credentials
    const consumerKey = Deno.env.get('GARMIN_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('GARMIN_CONSUMER_SECRET');

    if (!consumerKey || !consumerSecret) {
      console.error('Missing Garmin OAuth credentials');
      return errorResponse('Server configuration error', 500);
    }

    // Create Basic Auth header
    const authHeader = btoa(`${consumerKey}:${consumerSecret}`);

    // Request new access token using refresh token
    console.log('Requesting new Garmin access token...');
    const tokenResponse = await fetch('https://connectapi.garmin.com/oauth-service/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        client_id: consumerKey,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Garmin token refresh failed:', error);

      // If refresh token is invalid, delete it from database
      if (tokenResponse.status === 400 || tokenResponse.status === 401) {
        await supabase
          .from('oauth_tokens')
          .update({
            garmin_refresh_token_encrypted: null,
            garmin_access_token_expires_at: null,
          })
          .eq('user_id', userId);

        return errorResponse('Refresh token expired or revoked. Please re-authenticate.', 401);
      }

      return errorResponse('Failed to refresh access token', 400);
    }

    const tokens = await tokenResponse.json();
    const { access_token, expires_in, refresh_token: newRefreshToken } = tokens;

    // IMPORTANT: Garmin ALWAYS returns a new refresh token
    // We must store the new refresh token for next refresh
    if (!newRefreshToken) {
      console.error('Garmin did not return new refresh token');
      return errorResponse('No new refresh token received', 500);
    }

    console.log('Encrypting new Garmin refresh token...');
    const encryptedNewRefreshToken = await encryptToken(newRefreshToken);

    // Update expiry time (Garmin tokens ~3 months)
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Update both refresh token AND expiry
    await supabase
      .from('oauth_tokens')
      .update({
        garmin_refresh_token_encrypted: encryptedNewRefreshToken,
        garmin_access_token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    console.log('✅ Garmin token refreshed successfully for user:', userId);

    // Return new access token to client
    return jsonResponse({
      access_token,
      expires_in,
      expires_at: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Error in garmin-oauth-refresh:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
