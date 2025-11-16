/**
 * AutoSyncWarningModal - Toont warning als auto-sync aan staat maar OAuth token verlopen is
 */

import React, { useState, useEffect } from 'react';
import { syncService } from '@/services/sync.service';
import { googleDriveService } from '@/services/googledrive.service';

interface AutoSyncWarningModalProps {
  onClose: () => void;
}

export function AutoSyncWarningModal({ onClose }: AutoSyncWarningModalProps) {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    setError(null);

    try {
      await googleDriveService.signIn();

      // Dispatch event to notify components to refresh
      window.dispatchEvent(new CustomEvent('google-drive-reconnected'));

      // Auto-sync blijft enabled, alleen token is vernieuwd
      onClose();
    } catch (err: any) {
      setError(`Verbinding mislukt: ${err.message}`);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleDisableAutoSync = () => {
    syncService.disableAutoSync();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Google Drive Sessie Verlopen
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Je hebt automatische synchronisatie ingeschakeld, maar je Google Drive sessie is verlopen.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Let op:</strong> Je wijzigingen worden lokaal opgeslagen, maar niet automatisch gesynchroniseerd naar de cloud tot je opnieuw inlogt.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                isReconnecting
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isReconnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Verbinden...
                </>
              ) : (
                <>
                  🔄 Opnieuw Inloggen
                </>
              )}
            </button>

            <button
              onClick={handleDisableAutoSync}
              disabled={isReconnecting}
              className="w-full px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Auto-Sync Uitschakelen
            </button>

            <button
              onClick={onClose}
              disabled={isReconnecting}
              className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
            >
              Straks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if auto-sync warning should be shown
 */
export function useAutoSyncWarning() {
  const [shouldShowWarning, setShouldShowWarning] = useState(false);

  useEffect(() => {
    // Check on mount - wait for GoogleDriveService initialization first
    const checkAutoSyncStatus = async () => {
      // Wait for initialization to complete (including auto-refresh on startup)
      await googleDriveService.waitForInitialization();

      const autoSyncEnabled = syncService.isAutoSyncEnabled();
      const isSignedIn = googleDriveService.isSignedIn();

      // Show warning if auto-sync is enabled but user is not signed in
      if (autoSyncEnabled && !isSignedIn) {
        setShouldShowWarning(true);
      }
    };

    // Start check immediately (no delay needed since we wait for initialization)
    checkAutoSyncStatus();

    // Listen for runtime token expiry events
    const handleTokenExpiry = () => {
      const autoSyncEnabled = syncService.isAutoSyncEnabled();
      if (autoSyncEnabled) {
        setShouldShowWarning(true);
      }
    };

    // Listen for successful OAuth events to auto-close modal
    const handleOAuthSuccess = () => {
      setShouldShowWarning(false);
    };

    window.addEventListener('google-drive-token-expired', handleTokenExpiry);
    window.addEventListener('google-oauth-success', handleOAuthSuccess);
    window.addEventListener('google-drive-reconnected', handleOAuthSuccess);

    return () => {
      window.removeEventListener('google-drive-token-expired', handleTokenExpiry);
      window.removeEventListener('google-oauth-success', handleOAuthSuccess);
      window.removeEventListener('google-drive-reconnected', handleOAuthSuccess);
    };
  }, []);

  const dismissWarning = () => {
    setShouldShowWarning(false);
  };

  return {
    shouldShowWarning,
    dismissWarning,
  };
}
