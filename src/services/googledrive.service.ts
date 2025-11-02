/**
 * Google Drive Service - OAuth + file upload/download
 */

// BELANGRIJK: Vervang dit door je eigen Client ID
const GOOGLE_CLIENT_ID = '413904583159-t6fgs0dn819dtla2oqdu8dni0sibtujo.apps.googleusercontent.com'; // Vervang met jouw Client ID

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

  private tokenClient: any = null;
  private accessToken: string | null = null;

  /**
   * Initialize Google Identity Services
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Google Identity Services library
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
   * Sign in to Google and get access token
   */
  async signIn(): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES,
          callback: (response: GoogleTokenResponse) => {
            if (response.access_token) {
              this.accessToken = response.access_token;
              localStorage.setItem('google_access_token', response.access_token);

              // Store expiry time
              const expiresAt = Date.now() + (response.expires_in * 1000);
              localStorage.setItem('google_token_expires_at', expiresAt.toString());

              resolve();
            } else {
              reject(new Error('No access token received'));
            }
          },
          error_callback: (error: any) => {
            reject(new Error(`OAuth error: ${error.message || 'Unknown error'}`));
          },
        });

        this.tokenClient.requestAccessToken();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sign out and revoke token
   */
  async signOut(): Promise<void> {
    const token = this.getAccessToken();
    if (token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to revoke token:', error);
      }
    }

    this.accessToken = null;
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires_at');
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired
    const expiresAt = localStorage.getItem('google_token_expires_at');
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
      this.signOut();
      return false;
    }

    return true;
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
   * Find or create BiteBudget folder
   */
  private async findOrCreateFolder(): Promise<string> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    // Search for existing folder
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create new folder
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: this.FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    const createData = await createResponse.json();
    return createData.id;
  }

  /**
   * Find existing backup file
   */
  private async findFile(folderId: string): Promise<string | null> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${this.FILE_NAME}' and '${folderId}' in parents and trashed=false`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

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
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const folderId = await this.findOrCreateFolder();
    const existingFileId = await this.findFile(folderId);

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
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  }

  /**
   * Download encrypted data from Google Drive
   */
  async downloadData(): Promise<string | null> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const folderId = await this.findOrCreateFolder();
    const fileId = await this.findFile(folderId);

    if (!fileId) {
      return null; // No backup found
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Get last sync info
   */
  async getLastSyncInfo(): Promise<{ date: Date; size: number } | null> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const folderId = await this.findOrCreateFolder();
    const fileId = await this.findFile(folderId);

    if (!fileId) return null;

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=modifiedTime,size`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();

    return {
      date: new Date(data.modifiedTime),
      size: parseInt(data.size),
    };
  }
}

export const googleDriveService = new GoogleDriveService();
