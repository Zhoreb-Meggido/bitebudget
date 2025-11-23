import { useState, useEffect } from 'react';
import { syncService } from '@/services/sync.service';
import { googleDriveService } from '@/services/googledrive.service';

export type TabId = 'journaal' | 'tracking' | 'dashboard' | 'analyse' | 'data' | 'instellingen';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'journaal', label: 'Dagboek', icon: '📔' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'analyse', label: 'Analyse', icon: '📈' },
  { id: 'data', label: 'Data', icon: '💾' },
  { id: 'tracking', label: 'Tracking', icon: '⚖️' },
  { id: 'instellingen', label: 'Instellingen', icon: '⚙️' },
];

const ACTIVE_TAB_KEY = 'voedseljournaal_active_tab';

interface Props {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export function TabNavigation({ activeTab, onTabChange }: Props) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleRefresh = async () => {
    // Check if auto-sync is enabled and user is signed in
    const autoSyncEnabled = syncService.isAutoSyncEnabled();
    const isSignedIn = googleDriveService.isSignedIn();

    if (!autoSyncEnabled || !isSignedIn) {
      return; // Don't show button if conditions not met
    }

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      const password = syncService.getStoredPassword();
      if (!password) {
        throw new Error('Geen wachtwoord gevonden');
      }

      // Bidirectional sync: pull cloud changes + push local changes
      // syncToCloud with forceUpload=false does pull first, then push
      await syncService.syncToCloud(password, false);
      setSyncStatus('success');

      // Dispatch event to refresh all components
      window.dispatchEvent(new CustomEvent('data-synced'));

      // Clear success message after 2 seconds
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus('error');

      // Clear error message after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Check if sync button should be shown
  const showSyncButton = syncService.isAutoSyncEnabled() && googleDriveService.isSignedIn();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between">
          <nav className="flex justify-around sm:justify-start sm:space-x-8 flex-1" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-1 sm:gap-2
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                aria-label={tab.label}
              >
                <span className="text-base sm:text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Sync Button */}
          {showSyncButton && (
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={handleRefresh}
                disabled={isSyncing}
                className={`
                  p-2 rounded-lg transition-all flex items-center gap-1
                  ${isSyncing ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : ''}
                  ${syncStatus === 'success' ? 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400' : ''}
                  ${syncStatus === 'error' ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400' : ''}
                  ${syncStatus === 'idle' && !isSyncing ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800' : ''}
                `}
                title="Synchroniseer nu"
                aria-label="Synchroniseer nu"
              >
                <span className={`text-lg ${isSyncing ? 'animate-spin' : ''}`}>
                  {syncStatus === 'success' ? '✓' : syncStatus === 'error' ? '✗' : '🔄'}
                </span>
                <span className="hidden sm:inline text-sm font-medium">
                  {isSyncing ? 'Bezig...' : syncStatus === 'success' ? 'Bijgewerkt' : syncStatus === 'error' ? 'Fout' : 'Sync'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function useActiveTab(): [TabId, (tab: TabId) => void] {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY);
    return (saved as TabId) || 'journaal';
  });

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
  }, [activeTab]);

  return [activeTab, setActiveTab];
}
