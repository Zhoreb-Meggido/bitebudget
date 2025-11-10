/**
 * Google OAuth Token Refresh
 * Uses stored refresh token to get a new access token
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
    console.log('Retrieving refresh token for user:', userId);
    const { data, error: dbError } = await supabase
      .from('oauth_tokens')
      .select('google_refresh_token_encrypted')
      .eq('user_id', userId)
      .single();

    if (dbError || !data?.google_refresh_token_encrypted) {
      console.error('No refresh token found for user:', userId);
      return errorResponse('No refresh token found. Please re-authenticate.', 404);
    }

    // Decrypt refresh token
    console.log('Decrypting refresh token...');
    const refreshToken = await decryptToken(data.google_refresh_token_encrypted);

    // Get Google OAuth credentials
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials');
      return errorResponse('Server configuration error', 500);
    }

    // Request new access token using refresh token
    console.log('Requesting new access token from Google...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token refresh failed:', error);

      // If refresh token is invalid, delete it from database
      if (tokenResponse.status === 400) {
        await supabase
          .from('oauth_tokens')
          .update({
            google_refresh_token_encrypted: null,
            google_access_token_expires_at: null,
          })
          .eq('user_id', userId);

        return errorResponse('Refresh token expired or revoked. Please re-authenticate.', 401);
      }

      return errorResponse('Failed to refresh access token', 400);
    }

    const tokens = await tokenResponse.json();
    const { access_token, expires_in, refresh_token: newRefreshToken } = tokens;

    // Update expiry time
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // If Google returned a new refresh token, encrypt and store it
    // (Google sometimes rotates refresh tokens)
    if (newRefreshToken && newRefreshToken !== refreshToken) {
      console.log('Google provided new refresh token, updating...');
      const encryptedNewRefreshToken = await encryptToken(newRefreshToken);

      await supabase
        .from('oauth_tokens')
        .update({
          google_refresh_token_encrypted: encryptedNewRefreshToken,
          google_access_token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      // Just update expiry time
      await supabase
        .from('oauth_tokens')
        .update({
          google_access_token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    console.log('✅ Google token refreshed successfully for user:', userId);

    // Return new access token to client
    return jsonResponse({
      access_token,
      expires_in,
      expires_at: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Error in google-oauth-refresh:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
