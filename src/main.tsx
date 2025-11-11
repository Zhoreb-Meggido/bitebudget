// Main entry point voor de Voedseljournaal app
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './styles/main.css'
import { useDatabase } from '@/hooks'
import { TabNavigation, useActiveTab } from '@/components/TabNavigation'
import { JournalPage } from '@/components/journal/JournalPage'
import { TrackingPage } from '@/components/tracking/TrackingPage'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { AnalysePageWithTabs as AnalysePage } from '@/components/analyse/AnalysePageWithTabs'
import { DataPage } from '@/components/data/DataPage'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { registerServiceWorker, setupInstallPrompt } from '@/utils/pwa'
import { AppFooter } from '@/components/AppFooter'
import { AutoSyncWarningModal, useAutoSyncWarning } from '@/components/AutoSyncWarningModal'
import { TokenExpiringModal } from '@/components/TokenExpiringModal'

// App component met database initialisatie
function App() {
  const { isInitialized, error } = useDatabase();
  const [activeTab, setActiveTab] = useActiveTab();
  const { shouldShowWarning, dismissWarning } = useAutoSyncWarning();
  const [tokenExpiringMinutes, setTokenExpiringMinutes] = useState<number | null>(null);
  const [oauthProcessing, setOauthProcessing] = useState(false);

  // Handle OAuth callback (Google Drive Authorization Code Flow)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if this is an OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code) {
        // Prevent duplicate execution (React Strict Mode calls useEffect twice in dev)
        const processingFlag = sessionStorage.getItem('oauth_processing');
        if (processingFlag === code) {
          console.log('⏭️ OAuth callback already processing, skipping duplicate...');
          return;
        }

        // Mark this code as being processed
        sessionStorage.setItem('oauth_processing', code);

        setOauthProcessing(true);
        console.log('📥 OAuth callback detected, exchanging code for tokens...');

        try {
          const { googleDriveService } = await import('@/services/googledrive.service');
          await googleDriveService.handleOAuthCallback(code);

          // Clean URL and redirect to settings
          window.history.replaceState({}, document.title, window.location.pathname);
          setActiveTab('instellingen');

          console.log('✅ OAuth setup complete!');
        } catch (error) {
          console.error('❌ OAuth callback failed:', error);
          alert('Google Drive connectie mislukt. Probeer het opnieuw.');
          window.history.replaceState({}, document.title, window.location.pathname);
        } finally {
          setOauthProcessing(false);
          // Clear the processing flag
          sessionStorage.removeItem('oauth_processing');
        }
      }
    };

    handleOAuthCallback();
  }, [setActiveTab]);

  // Register PWA service worker and install prompt
  useEffect(() => {
    // Only register service worker in production (not during development)
    if (import.meta.env.PROD) {
      registerServiceWorker().then((registration) => {
        if (registration) {
          console.log('✅ PWA ready for offline use');
        }
      });

      // Setup install prompt handler
      setupInstallPrompt();
    } else {
      // Development mode: actively unregister any existing service workers
      console.log('🔧 Development mode: Unregistering service workers...');

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister().then((success) => {
              if (success) {
                console.log('🗑️ Service worker unregistered successfully');
              }
            });
          });
        });

        // Also clear any caches
        if ('caches' in window) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              caches.delete(cacheName);
              console.log('🗑️ Cache deleted:', cacheName);
            });
          });
        }
      }
    }
  }, []);

  // Listen for token expiring event
  useEffect(() => {
    const handleTokenExpiring = (event: CustomEvent) => {
      const { minutesRemaining } = event.detail;
      setTokenExpiringMinutes(minutesRemaining);
    };

    const handleTokenRefreshed = () => {
      setTokenExpiringMinutes(null);
    };

    window.addEventListener('google-drive-token-expiring', handleTokenExpiring as EventListener);
    window.addEventListener('google-token-refreshed', handleTokenRefreshed);

    return () => {
      window.removeEventListener('google-drive-token-expiring', handleTokenExpiring as EventListener);
      window.removeEventListener('google-token-refreshed', handleTokenRefreshed);
    };
  }, []);

  // Auto-refresh token when user returns to the app
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // User returned to the app - check if token needs refresh
        const { googleDriveService } = await import('@/services/googledrive.service');

        if (googleDriveService.isSignedIn() && googleDriveService.needsReauthentication(5)) {
          console.log('👀 User returned - attempting token refresh...');

          // Try to refresh (will show popup if needed)
          const refreshed = await googleDriveService.manualRefresh();

          if (refreshed) {
            console.log('✅ Token automatically refreshed on user return');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Database Error
          </h1>
          <p className="text-gray-700">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized || oauthProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {oauthProcessing ? 'Google Drive wordt verbonden...' : 'Database wordt geïnitialiseerd...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto py-4">
        {activeTab === 'journaal' && <JournalPage />}
        {activeTab === 'tracking' && <TrackingPage />}
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'analyse' && <AnalysePage />}
        {activeTab === 'data' && <DataPage />}
        {activeTab === 'instellingen' && <SettingsPage />}
      </div>
      <AppFooter />

      {/* Auto-Sync Warning Modal */}
      {shouldShowWarning && (
        <AutoSyncWarningModal onClose={dismissWarning} />
      )}

      {/* Token Expiring Warning Modal */}
      {tokenExpiringMinutes !== null && (
        <TokenExpiringModal
          minutesRemaining={tokenExpiringMinutes}
          onClose={() => setTokenExpiringMinutes(null)}
        />
      )}
    </div>
  );
}

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
