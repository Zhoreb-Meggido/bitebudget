/**
 * PWA Registration and Update Management
 */

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Workers not supported in this browser');
    return null;
  }

  try {
    // Register service worker at root of app (./sw.js)
    const registration = await navigator.serviceWorker.register('./sw.js');

    console.log('✅ Service Worker registered:', registration.scope);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          console.log('🔄 New version available!');
          showUpdateNotification(registration);
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  const updateAvailable = confirm(
    '🔄 Een nieuwe versie van BiteBudget is beschikbaar!\n\n' +
    'Klik op OK om de app te updaten.'
  );

  if (updateAvailable && registration.waiting) {
    // Tell the service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page when the new service worker activates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}

/**
 * Check if app is running as PWA (standalone mode)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true || // iOS
    document.referrer.includes('android-app://') // Android TWA
  );
}

/**
 * Check if app can be installed (beforeinstallprompt available)
 */
export function canInstall(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

/**
 * Prompt user to install PWA
 */
let deferredPrompt: any = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Stash the event so it can be triggered later
    deferredPrompt = e;

    console.log('📱 PWA install prompt available');

    // Optionally show custom install button
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    deferredPrompt = null;
    hideInstallButton();
  });
}

/**
 * Trigger install prompt
 */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('⚠️ Install prompt not available');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;

  console.log(`User response to install prompt: ${outcome}`);

  // Clear the deferred prompt
  deferredPrompt = null;

  return outcome === 'accepted';
}

/**
 * Show install button (implement in UI)
 */
function showInstallButton() {
  // Dispatch custom event that UI can listen to
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
}

/**
 * Hide install button
 */
function hideInstallButton() {
  window.dispatchEvent(new CustomEvent('pwa-install-completed'));
}

/**
 * Get PWA installation status
 */
export function getPWAStatus() {
  return {
    isStandalone: isStandalone(),
    canInstall: !!deferredPrompt,
    supportsServiceWorker: 'serviceWorker' in navigator,
    isOnline: navigator.onLine,
  };
}
