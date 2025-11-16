/**
 * Health Connect Backup Service
 * Handles importing Health Connect backups from mapped Google Drive (Windows)
 * Using File System Access API
 */

import JSZip from 'jszip';

export interface BackupFileInfo {
  name: string;
  size: number;
  modifiedDate: Date;
}

class HealthConnectBackupService {
  /**
   * Check if File System Access API is supported
   */
  isSupported(): boolean {
    return 'showOpenFilePicker' in window;
  }

  /**
   * Open file picker to select Health Connect backup file
   * Supports .zip, .tar.gz, .db, .sqlite files
   */
  async selectBackupFile(): Promise<File> {
    if (!this.isSupported()) {
      throw new Error('File System Access API niet ondersteund in deze browser. Gebruik Chrome/Edge.');
    }

    try {
      // Show file picker
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Health Connect Backup',
            accept: {
              'application/zip': ['.zip'],
              'application/x-gzip': ['.gz', '.tar.gz'],
              'application/x-sqlite3': ['.db', '.sqlite', '.sqlite3'],
              'application/octet-stream': ['.backup', '.bak'],
            },
          },
        ],
        multiple: false,
      });

      const file = await fileHandle.getFile();
      return file;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Bestandsselectie geannuleerd');
      }
      throw new Error(`Bestand selecteren mislukt: ${error.message}`);
    }
  }

  /**
   * Open directory picker and find Health Connect backup
   * Searches for typical Health Connect backup file patterns
   */
  async selectBackupFromDirectory(): Promise<File> {
    if (!this.isSupported()) {
      throw new Error('File System Access API niet ondersteund in deze browser. Gebruik Chrome/Edge.');
    }

    try {
      // Show directory picker
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
      });

      // Search for Health Connect database file
      const backupFiles: File[] = [];

      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();

          // Look for Health Connect backup patterns
          if (
            file.name.endsWith('.db') ||
            file.name.endsWith('.sqlite') ||
            file.name.endsWith('.sqlite3') ||
            file.name.includes('healthconnect') ||
            file.name.includes('health_connect')
          ) {
            backupFiles.push(file);
          }
        }
      }

      if (backupFiles.length === 0) {
        throw new Error('Geen Health Connect backup gevonden in deze map. Zorg dat je de juiste backup folder selecteert.');
      }

      // Return the most recent file if multiple found
      if (backupFiles.length > 1) {
        backupFiles.sort((a, b) => b.lastModified - a.lastModified);
        console.log(`Found ${backupFiles.length} backup files, using most recent: ${backupFiles[0].name}`);
      }

      return backupFiles[0];
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Map selectie geannuleerd');
      }
      throw new Error(`Map selecteren mislukt: ${error.message}`);
    }
  }

  /**
   * Extract database from backup file
   * Handles compressed archives (.zip, .tar.gz) or direct .db files
   */
  async extractDatabase(backupFile: File): Promise<File> {
    const fileName = backupFile.name.toLowerCase();

    // If it's already a database file, return as-is
    if (fileName.endsWith('.db') || fileName.endsWith('.sqlite') || fileName.endsWith('.sqlite3')) {
      return backupFile;
    }

    // If it's a zip file, extract it
    if (fileName.endsWith('.zip')) {
      return await this.extractFromZip(backupFile);
    }

    // If it's a tar.gz, we need to handle it differently
    // For now, throw error (tar.gz support can be added later)
    if (fileName.endsWith('.tar.gz') || fileName.endsWith('.tgz')) {
      throw new Error('TAR.GZ bestanden worden nog niet ondersteund. Pak eerst uit met 7-Zip of WinRAR.');
    }

    // Unknown format
    throw new Error(`Onbekend backup formaat: ${fileName}. Ondersteund: .db, .sqlite, .zip`);
  }

  /**
   * Extract database from ZIP archive
   */
  private async extractFromZip(zipFile: File): Promise<File> {
    try {
      const zip = await JSZip.loadAsync(zipFile);

      // Find database file in ZIP
      const dbFiles = Object.keys(zip.files).filter(filename => {
        const lower = filename.toLowerCase();
        return (
          (lower.endsWith('.db') || lower.endsWith('.sqlite') || lower.endsWith('.sqlite3')) &&
          !filename.startsWith('__MACOSX') &&
          !filename.startsWith('.')
        );
      });

      if (dbFiles.length === 0) {
        throw new Error('Geen database bestand gevonden in ZIP archief');
      }

      if (dbFiles.length > 1) {
        console.warn(`Meerdere database bestanden gevonden, gebruik: ${dbFiles[0]}`);
      }

      const dbFileName = dbFiles[0];
      const dbFile = zip.files[dbFileName];

      // Extract as blob
      const blob = await dbFile.async('blob');

      // Convert blob to File
      const file = new File([blob], dbFileName.split('/').pop() || 'healthconnect.db', {
        type: 'application/x-sqlite3',
      });

      console.log(`✅ Extracted ${file.name} (${(file.size / 1024).toFixed(2)} KB) from ZIP`);

      return file;
    } catch (error: any) {
      throw new Error(`ZIP extractie mislukt: ${error.message}`);
    }
  }

  /**
   * Get info about backup file without extracting
   */
  async getBackupInfo(backupFile: File): Promise<BackupFileInfo> {
    return {
      name: backupFile.name,
      size: backupFile.size,
      modifiedDate: new Date(backupFile.lastModified),
    };
  }
}

export const healthConnectBackupService = new HealthConnectBackupService();
