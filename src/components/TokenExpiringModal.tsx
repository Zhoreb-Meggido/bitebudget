/**
 * TokenExpiringModal - Waarschuwt gebruiker dat OAuth token bijna verloopt
 */

import { useState } from 'react';
import { googleDriveService } from '@/services/googledrive.service';

interface TokenExpiringModalProps {
  minutesRemaining: number;
  onClose: () => void;
}

export function TokenExpiringModal({ minutesRemaining, onClose }: TokenExpiringModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const success = await googleDriveService.manualRefresh();

      if (success) {
        // Successfully refreshed
        onClose();
      } else {
        setError('Token vernieuwen mislukt. Probeer het opnieuw.');
      }
    } catch (err: any) {
      setError(`Fout: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⏰</span>
          <h2 className="text-xl font-bold text-gray-900">
            Sessie Verloopt Binnenkort
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-700">
            Je Google Drive sessie verloopt over <strong>{minutesRemaining} minuten</strong>.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Vernieuw nu je sessie om automatische synchronisatie actief te houden.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                isRefreshing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Vernieuwen...
                </>
              ) : (
                <>
                  🔄 Sessie Verlengen
                </>
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isRefreshing}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Herinner me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
