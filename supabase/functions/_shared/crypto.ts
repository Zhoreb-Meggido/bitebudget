/**
 * Encryption utilities for OAuth tokens
 * Uses Web Crypto API for AES-256-GCM encryption
 */

// Get encryption key from environment variable
const getEncryptionKey = async (): Promise<CryptoKey> => {
  const keyMaterial = Deno.env.get('OAUTH_ENCRYPTION_KEY');
  if (!keyMaterial) {
    throw new Error('OAUTH_ENCRYPTION_KEY environment variable not set');
  }

  // Convert base64 key to CryptoKey
  const keyData = Uint8Array.from(atob(keyMaterial), c => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypt a refresh token using AES-256-GCM
 */
export const encryptToken = async (token: string): Promise<string> => {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  const encoded = new TextEncoder().encode(token);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Combine IV and ciphertext, then base64 encode
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
};

/**
 * Decrypt a refresh token using AES-256-GCM
 */
export const decryptToken = async (encryptedToken: string): Promise<string> => {
  const key = await getEncryptionKey();

  // Decode base64 and split IV and ciphertext
  const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
};
