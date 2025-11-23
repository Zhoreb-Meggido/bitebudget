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
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ModalStateProvider, useModalState } from '@/contexts/ModalStateContext'
import { QuickActions } from '@/components/QuickActions'
import { AddMealModalV2 } from '@/components/journal/AddMealModal.v2'
import { ProductEditModal } from '@/components/data/ProductEditModal'
import { BarcodeScanner } from '@/components/data/BarcodeScanner'
import { OpenFoodFactsSearch } from '@/components/data/OpenFoodFactsSearch'
import { AddWaterModal } from '@/components/modals/AddWaterModal'
import { useProducts, useEntries } from '@/hooks'
import { getTodayDate } from '@/utils'
import { openFoodFactsService } from '@/services/openfoodfacts.service'
import { productsService } from '@/services/products.service'

// Inner app component with modal state access
function AppContent() {
  const [activeTab, setActiveTab] = useActiveTab();
  const { shouldShowWarning, dismissWarning } = useAutoSyncWarning();
  const [tokenExpiringMinutes, setTokenExpiringMinutes] = useState<number | null>(null);
  const [oauthProcessing, setOauthProcessing] = useState(false);
  const { hasUnsavedChanges } = useModalState();

  // Global QuickActions modal states
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAddWaterModal, setShowAddWaterModal] = useState(false);

  // Data hooks for global modals
  const { products, addProduct, updateProduct, reloadProducts } = useProducts();
  const { addEntry } = useEntries();
  const [selectedDate] = useState(getTodayDate());

  // QuickActions handlers
  const handleQuickAddMeal = () => {
    setActiveTab('journaal'); // Switch to journal tab
    setShowAddMealModal(true);
  };

  const handleQuickAddProduct = () => {
    setShowAddProductModal(true);
  };

  const handleQuickScan = () => {
    setShowQuickActions(false); // Close bottom sheet first
    setShowScannerModal(true);
  };

  const handleQuickSearch = () => {
    setShowQuickActions(false); // Close bottom sheet first
    setShowSearchModal(true);
  };

  const handleQuickAddWater = () => {
    setShowAddWaterModal(true);
  };

  // Product modal save handler
  const handleSaveProduct = async (data: any) => {
    await addProduct(data);
    setShowAddProductModal(false);
  };

  // Barcode scan handler
  const handleBarcodeScan = async (barcode: string) => {
    try {
      const result = await openFoodFactsService.getProductByBarcode(barcode);
      if (result) {
        await productsService.addProduct(result);
        await reloadProducts();
        setShowScannerModal(false);
        alert(`✓ Product toegevoegd: ${result.name}`);
      } else {
        alert('❌ Product niet gevonden');
      }
    } catch (error: any) {
      alert(error.message || 'Fout bij opslaan product');
    }
  };

  // Search product handler
  const handleProductSelected = async (product: any) => {
    try {
      await productsService.addProduct(product);
      await reloadProducts();
      setShowSearchModal(false);
      alert(`✓ Product toegevoegd: ${product.name}`);
    } catch (error: any) {
      alert(error.message || 'Fout bij opslaan product');
    }
  };

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

  // Listen for modal dirty state checks (from sync service)
  useEffect(() => {
    const handleDirtyStateCheck = (event: Event) => {
      // If there are unsaved changes, prevent the event (which cancels auto-sync)
      if (hasUnsavedChanges()) {
        event.preventDefault();
        console.log('🔒 Auto-sync blocked: Modal has unsaved changes');
      }
    };

    window.addEventListener('check-modal-dirty-state', handleDirtyStateCheck);

    return () => {
      window.removeEventListener('check-modal-dirty-state', handleDirtyStateCheck);
    };
  }, [hasUnsavedChanges]);

  if (oauthProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Google Drive wordt verbonden...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto py-4">
        {activeTab === 'journaal' && <JournalPage />}
        {activeTab === 'tracking' && <TrackingPage />}
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'analyse' && <AnalysePage />}
        {activeTab === 'data' && <DataPage />}
        {activeTab === 'instellingen' && <SettingsPage />}
      </div>
      <AppFooter onQuickActionsClick={() => setShowQuickActions(true)} />

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

      {/* Global QuickActions Bottom Sheet */}
      <QuickActions
        isOpen={showQuickActions}
        onToggle={() => setShowQuickActions(!showQuickActions)}
        onAddMeal={handleQuickAddMeal}
        onAddProduct={handleQuickAddProduct}
        onScan={handleQuickScan}
        onSearch={handleQuickSearch}
        onAddWater={handleQuickAddWater}
      />

      {/* Global Modals for QuickActions */}
      {showAddMealModal && (
        <AddMealModalV2
          isOpen={showAddMealModal}
          onClose={() => setShowAddMealModal(false)}
          onAddMeal={async (entry) => {
            await addEntry(entry);
            setShowAddMealModal(false);
          }}
          onUpdateMeal={async () => {
            // Not used in quick add context
          }}
          editEntry={undefined}
          products={products}
          selectedDate={selectedDate}
          quickAddTemplate={null}
        />
      )}

      {showAddProductModal && (
        <ProductEditModal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          product={null}
          onSave={handleSaveProduct}
        />
      )}

      {showScannerModal && (
        <BarcodeScanner
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onScan={handleBarcodeScan}
        />
      )}

      {showSearchModal && (
        <OpenFoodFactsSearch
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSelectProduct={handleProductSelected}
        />
      )}

      {showAddWaterModal && (
        <AddWaterModal
          isOpen={showAddWaterModal}
          onClose={() => setShowAddWaterModal(false)}
        />
      )}
    </div>
  );
}

// Outer App component with providers and database initialization
function App() {
  const { isInitialized, error } = useDatabase();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Database Error
          </h1>
          <p className="text-gray-700 dark:text-gray-300">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Database wordt geïnitialiseerd...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ModalStateProvider>
        <AppContent />
      </ModalStateProvider>
    </ThemeProvider>
  );
}

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
