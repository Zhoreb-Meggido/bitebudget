/**
 * CloudSyncSettings - Google Drive sync met encryptie
 */

import React, { useState, useEffect } from 'react';
import { googleDriveService } from '@/services/googledrive.service';
import { syncService } from '@/services/sync.service';

export function CloudSyncSettings() {
  const [isConnected, setIsConnected] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cloudInfo, setCloudInfo] = useState<{ date: Date; size: number } | null>(null);

  const refreshConnectionState = () => {
    // Check if already connected
    setIsConnected(googleDriveService.isSignedIn());

    // Load last sync time
    const lastSyncTime = syncService.getLastSyncTime();
    setLastSync(lastSyncTime);

    // Load stored password if exists
    const storedPassword = syncService.getStoredPassword();
    if (storedPassword) {
      setEncryptionPassword(storedPassword);
      setRememberPassword(true);
    }

    // Check if auto-sync is enabled
    setAutoSyncEnabled(syncService.isAutoSyncEnabled());

    // Load cloud info if connected
    if (googleDriveService.isSignedIn()) {
      loadCloudInfo();
    }
  };

  useEffect(() => {
    refreshConnectionState();

    // Listen for reconnection events from modal
    const handleReconnect = () => {
      refreshConnectionState();
    };

    window.addEventListener('google-drive-reconnected', handleReconnect);

    return () => {
      window.removeEventListener('google-drive-reconnected', handleReconnect);
    };
  }, []);

  const loadCloudInfo = async (shouldAutoSync: boolean = true) => {
    try {
      const info = await googleDriveService.getLastSyncInfo();
      setCloudInfo(info);

      // Auto-sync als ingeschakeld (bijv. bij app start of reconnect)
      if (shouldAutoSync && !isSyncing) {
        const isAutoSyncEnabled = syncService.isAutoSyncEnabled();
        const storedPassword = syncService.getStoredPassword();

        if (isAutoSyncEnabled && storedPassword) {
          console.log('Auto-sync is enabled, syncing local changes to cloud...');
          setIsSyncing(true);

          try {
            // Pull nieuwere data uit de cloud en upload lokale wijzigingen
            await syncService.pullIfNewer(storedPassword);
            await syncService.syncToCloud(storedPassword, false);
            setLastSync(new Date());
          } catch (syncErr: any) {
            console.error('Auto-sync in loadCloudInfo mislukt:', syncErr);
          } finally {
            setIsSyncing(false);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load cloud info:', err);
    }
  };

  const handleConnect = async () => {
    setError(null);
    setSuccess(null);

    try {
      await googleDriveService.signIn();
      setIsConnected(true);
      setSuccess('✅ Verbonden met Google Drive');

      // loadCloudInfo zal automatisch syncen als auto-sync is ingeschakeld
      await loadCloudInfo();
    } catch (err: any) {
      setError(`Verbinding mislukt: ${err.message}`);
    }
  };

  const handleDisconnect = async () => {
    // Disable auto-sync first
    if (autoSyncEnabled) {
      syncService.disableAutoSync();
      setAutoSyncEnabled(false);
    }

    // Sign out from Google Drive
    await googleDriveService.signOut();

    // Clear local state
    setIsConnected(false);
    setCloudInfo(null);
    setSuccess('Ontkoppeld van Google Drive');
  };

  const handleSync = async () => {
    if (!encryptionPassword) {
      setError('Voer een encryptie wachtwoord in');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSyncing(true);

    try {
      // Manual sync also merges (safer - won't lose data)
      await syncService.syncToCloud(encryptionPassword, false);

      if (rememberPassword) {
        syncService.storePassword(encryptionPassword);
      }

      const now = new Date();
      setLastSync(now);
      setSuccess(`✅ Gesynchroniseerd naar Google Drive (${now.toLocaleTimeString('nl-NL')})`);
      await loadCloudInfo(false); // Geen auto-sync, we hebben net handmatig gesynced
    } catch (err: any) {
      setError(`Sync mislukt: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (!encryptionPassword) {
      setError('Voer een encryptie wachtwoord in');
      return;
    }

    if (!confirm('⚠️ Dit haalt data op uit Google Drive en voegt samen met je lokale data. Cloud data heeft voorrang bij conflicten. Doorgaan?')) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSyncing(true);

    try {
      // Restore now also merges instead of full overwrite
      await syncService.mergeFromCloud(encryptionPassword);

      if (rememberPassword) {
        syncService.storePassword(encryptionPassword);
      }

      const now = new Date();
      setLastSync(now);
      setSuccess('✅ Data samengevoegd met Google Drive');

      // Reload page to show merged data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(`Herstel mislukt: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = () => {
    if (!encryptionPassword) {
      setError('Voer eerst een encryptie wachtwoord in voor auto-sync');
      return;
    }

    if (autoSyncEnabled) {
      syncService.disableAutoSync();
      setAutoSyncEnabled(false);
      setSuccess('⏸️ Auto-sync uitgeschakeld');
    } else {
      syncService.enableAutoSync(encryptionPassword);
      setAutoSyncEnabled(true);
      setSuccess('▶️ Auto-sync ingeschakeld - wijzigingen worden automatisch gesynchroniseerd');
    }

    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">☁️ Cloud Synchronisatie</h3>
        <p className="text-sm text-gray-600">
          Sync je data veilig (encrypted) naar Google Drive. Werkt automatisch tussen al je apparaten.
        </p>
      </div>

      {!isConnected ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-3">
            Verbind met Google Drive om je data veilig te synchroniseren tussen apparaten.
          </p>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            Verbind met Google Drive
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-medium">✓ Verbonden met Google Drive</span>
              {cloudInfo && (
                <span className="text-xs text-gray-600">
                  ({(cloudInfo.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>
            <button
              onClick={handleDisconnect}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Ontkoppelen
            </button>
          </div>

          {/* Encryption Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Encryptie Wachtwoord
            </label>
            <input
              type="password"
              value={encryptionPassword}
              onChange={(e) => setEncryptionPassword(e.target.value)}
              placeholder="Kies een sterk wachtwoord"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-password"
                checked={rememberPassword}
                onChange={(e) => {
                  setRememberPassword(e.target.checked);
                  if (!e.target.checked) {
                    syncService.clearStoredPassword();
                  }
                }}
                className="rounded"
              />
              <label htmlFor="remember-password" className="text-sm text-gray-600">
                Onthoud wachtwoord op dit apparaat
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              ⚠️ Belangrijk: Als je dit wachtwoord vergeet, kun je je backup niet meer herstellen!
            </p>
          </div>

          {/* Sync Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSync}
              disabled={isSyncing || !encryptionPassword}
              className={`flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                isSyncing || !encryptionPassword
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSyncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Bezig...
                </>
              ) : (
                <>
                  📤 Push naar Drive
                </>
              )}
            </button>

            <button
              onClick={handleRestore}
              disabled={isSyncing || !encryptionPassword}
              className={`flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                isSyncing || !encryptionPassword
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              📥 Pull vanaf Drive
            </button>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">🔄 Automatische Synchronisatie</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Synchroniseer automatisch bij wijzigingen (30 sec vertraging)
                </p>
              </div>
              <button
                onClick={handleToggleAutoSync}
                disabled={!encryptionPassword}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSyncEnabled ? 'bg-green-600' : 'bg-gray-300'
                } ${!encryptionPassword ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {autoSyncEnabled && (
              <div className="mt-2 text-xs text-green-700">
                ✓ Auto-sync actief - Wijzigingen worden automatisch gesynchroniseerd
              </div>
            )}
          </div>

          {/* Last Sync Info */}
          {lastSync && (
            <div className="text-sm text-gray-600">
              Laatste sync: {lastSync.toLocaleString('nl-NL')}
            </div>
          )}

          {cloudInfo && (
            <div className="text-sm text-gray-600">
              Cloud backup: {cloudInfo.date.toLocaleString('nl-NL')}
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
            <p className="font-medium mb-2">ℹ️ Hoe het werkt:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Je data wordt encrypted met jouw wachtwoord</li>
              <li>Alleen jij kunt de data lezen (end-to-end encrypted)</li>
              <li>Google kan de inhoud niet zien</li>
              <li>Gebruik hetzelfde wachtwoord op al je apparaten</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
