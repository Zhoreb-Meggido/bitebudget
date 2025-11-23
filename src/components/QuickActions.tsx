/**
 * QuickActions - Bottom sheet menu for quick access
 * Hamburger menu in footer that opens bottom sheet with frequently used actions
 */

import React, { useState } from 'react';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}

interface Props {
  onAddMeal: () => void;
  onAddProduct: () => void;
  onScan: () => void;
  onSearch: () => void;
  onAddWater: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function QuickActions({ onAddMeal, onAddProduct, onScan, onSearch, onAddWater, isOpen, onToggle }: Props) {
  const actions: QuickAction[] = [
    {
      id: 'add-meal',
      icon: '🍽️',
      label: 'Maaltijd toevoegen',
      description: 'Voeg een maaltijd toe aan je journaal',
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => {
        onAddMeal();
        onToggle();
      },
    },
    {
      id: 'add-water',
      icon: '💧',
      label: 'Water toevoegen',
      description: 'Houd je dagelijkse vochtinname bij',
      color: 'bg-cyan-600 hover:bg-cyan-700',
      onClick: () => {
        onAddWater();
        onToggle();
      },
    },
    {
      id: 'add-product',
      icon: '➕',
      label: 'Product toevoegen',
      description: 'Maak een nieuw product aan',
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => {
        onAddProduct();
        onToggle();
      },
    },
    {
      id: 'scan',
      icon: '📷',
      label: 'Product scannen',
      description: 'Scan een barcode om product toe te voegen',
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => {
        onScan();
        onToggle();
      },
    },
    {
      id: 'search',
      icon: '🔍',
      label: 'Product zoeken',
      description: 'Zoek product in OpenFoodFacts database',
      color: 'bg-orange-600 hover:bg-orange-700',
      onClick: () => {
        onSearch();
        onToggle();
      },
    },
  ];

  return (
    <>
      {/* Backdrop when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-200"
          onClick={onToggle}
        />
      )}

      {/* Bottom Sheet - positioned above footer, full width on mobile, left-aligned within container on desktop */}
      <div
        className={`fixed left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'bottom-[52px]' : 'translate-y-full bottom-0'
        }`}
        style={{ bottom: isOpen ? '52px' : undefined }}
      >
        <div className="sm:max-w-7xl sm:mx-auto sm:flex sm:justify-start">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl sm:max-w-md sm:w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Snelle acties
              </h3>
              <button
                onClick={onToggle}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Sluiten"
              >
                <span className="text-2xl text-gray-500 dark:text-gray-400">×</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-3 space-y-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors active:scale-98 transform"
                >
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm">
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {action.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {action.description}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-gray-400 dark:text-gray-500">›</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom padding for safe area */}
            <div className="h-4" />
          </div>
        </div>
      </div>
    </>
  );
}
