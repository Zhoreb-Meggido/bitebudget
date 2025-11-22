/**
 * AppFooter - Version info and app metadata with QuickActions menu button
 */

import React from 'react';
import packageJson from '../../package.json';

const APP_VERSION = packageJson.version;
const BUILD_DATE = new Date().toISOString().split('T')[0];

interface Props {
  onQuickActionsClick: () => void;
}

export function AppFooter({ onQuickActionsClick }: Props) {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 px-4 flex-shrink-0 sticky bottom-0 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: menu button spans 2 rows, Desktop: single row */}
        <div className="flex items-stretch sm:items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          {/* QuickActions Menu Button - spans full height on mobile only */}
          <button
            onClick={onQuickActionsClick}
            className="flex-shrink-0 w-10 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95 transform"
            aria-label="Snelle acties menu"
            title="Snelle acties"
          >
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Content area: 2 rows on mobile (centered), 1 row on desktop */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            {/* Version Info */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span>BiteBudget v{APP_VERSION}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Build: {BUILD_DATE}</span>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center justify-center sm:justify-end gap-2">
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

          {/* Spacer for balance on mobile (same width as hamburger button) - hidden on desktop */}
          <div className="flex-shrink-0 w-10 sm:hidden" />
        </div>
      </div>
    </footer>
  );
}
