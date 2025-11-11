/**
 * Google OAuth Initialization
 * Exchanges authorization code for access token and refresh token
 * Stores encrypted refresh token in database
 *
 * VERSION: 1.1.0 (with PKCE code_verifier support)
 */

const FUNCTION_VERSION = '1.1.0';

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken } from '../_shared/crypto.ts';
import { corsHeaders, handleCorsPreFlight, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface RequestBody {
  code: string;
  redirectUri: string;
  codeVerifier: string; // PKCE code verifier
  userId: string; // Browser fingerprint or user identifier
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight();
  }

  try {
    console.log(`🚀 google-oauth-init v${FUNCTION_VERSION} starting...`);

    // Parse request body
    const { code, redirectUri, codeVerifier, userId }: RequestBody = await req.json();

    console.log('📦 Received request:', {
      hasCode: !!code,
      hasRedirectUri: !!redirectUri,
      hasCodeVerifier: !!codeVerifier,
      codeVerifierLength: codeVerifier?.length,
      hasUserId: !!userId,
    });

    if (!code || !redirectUri || !codeVerifier || !userId) {
      return errorResponse('Missing required fields: code, redirectUri, codeVerifier, userId');
    }

    // Get Google OAuth credentials from environment
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials');
      return errorResponse('Server configuration error', 500);
    }

    // Exchange authorization code for tokens
    console.log('🔄 Exchanging authorization code for tokens with PKCE...');
    console.log('📤 Sending to Google:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri,
      codeVerifierLength: codeVerifier.length,
      grantType: 'authorization_code',
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier, // PKCE code verifier
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        redirectUri, // Log redirect URI for debugging
      });

      // Try to parse error as JSON for better error message
      let errorMessage = 'Token exchange failed';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error === 'invalid_grant') {
          errorMessage = `Token exchange failed: ${errorJson.error} - ${errorJson.error_description || 'Bad Request'}. This usually means: 1) Redirect URI mismatch (check Google Cloud Console), 2) Authorization code expired/already used, or 3) Code verifier mismatch (PKCE).`;
        } else {
          errorMessage = `Token exchange failed: ${errorJson.error} - ${errorJson.error_description || 'Unknown error'}`;
        }
      } catch (e) {
        errorMessage = `Token exchange failed: ${errorText}`;
      }

      return errorResponse(errorMessage, 400);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!refresh_token) {
      console.error('No refresh token received from Google');
      return errorResponse('No refresh token received. User may need to re-authorize with prompt=consent', 400);
    }

    // Encrypt refresh token
    console.log('Encrypting refresh token...');
    const encryptedRefreshToken = await encryptToken(refresh_token);

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Store in database
    console.log('Storing tokens in database...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert (insert or update if exists)
    const { error: dbError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        google_refresh_token_encrypted: encryptedRefreshToken,
        google_access_token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return errorResponse('Failed to store tokens', 500);
    }

    console.log('✅ Google OAuth initialization successful for user:', userId);

    // Return access token to client (NOT refresh token!)
    return jsonResponse({
      access_token,
      expires_in,
      expires_at: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Error in google-oauth-init:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
