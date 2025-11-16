/**
 * AppFooter - Version info and app metadata
 */

import React from 'react';
import packageJson from '../../package.json';

const APP_VERSION = packageJson.version;
const BUILD_DATE = new Date().toISOString().split('T')[0];

export function AppFooter() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 px-4 flex-shrink-0 sticky bottom-0 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>BiteBudget v{APP_VERSION}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Build: {BUILD_DATE}</span>
        </div>
        <div className="flex items-center gap-2">
          {navigator.onLine ? (
            <span className="text-green-600 dark:text-green-400">🟢 Online</span>
          ) : (
            <span className="text-orange-600 dark:text-orange-400">🟠 Offline</span>
          )}
          {'serviceWorker' in navigator && (
            <span className="text-blue-600 dark:text-blue-400">• PWA Active</span>
          )}
        </div>
      </div>
    </footer>
  );
}
