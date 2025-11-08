// Main entry point voor de Voedseljournaal app
import React, { useEffect } from 'react'
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

// App component met database initialisatie
function App() {
  const { isInitialized, error } = useDatabase();
  const [activeTab, setActiveTab] = useActiveTab();
  const { shouldShowWarning, dismissWarning } = useAutoSyncWarning();

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

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Database wordt geïnitialiseerd...</p>
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
    </div>
  );
}

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
