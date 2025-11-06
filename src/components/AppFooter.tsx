/**
 * AppFooter - Version info and app metadata
 */

import React from 'react';

const APP_VERSION = '1.2.1';
const BUILD_DATE = new Date().toISOString().split('T')[0];

export function AppFooter() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-2 px-4 flex-shrink-0 sticky bottom-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>BiteBudget v{APP_VERSION}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Build: {BUILD_DATE}</span>
        </div>
        <div className="flex items-center gap-2">
          {navigator.onLine ? (
            <span className="text-green-600">🟢 Online</span>
          ) : (
            <span className="text-orange-600">🟠 Offline</span>
          )}
          {'serviceWorker' in navigator && (
            <span className="text-blue-600">• PWA Active</span>
          )}
        </div>
      </div>
    </footer>
  );
}
