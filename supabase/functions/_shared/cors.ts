/**
 * CORS utilities for Edge Functions
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, replace with your domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Handle CORS preflight requests
 */
export const handleCorsPreFlight = (): Response => {
  return new Response('ok', { headers: corsHeaders });
};

/**
 * Create a JSON response with CORS headers
 */
export const jsonResponse = (data: any, status: number = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create an error response with CORS headers
 */
export const errorResponse = (message: string, status: number = 400): Response => {
  return jsonResponse({ error: message }, status);
};
