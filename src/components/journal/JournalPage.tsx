/**
 * JournalPage - Main meal tracking component
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useEntries, useProducts, useSettings } from '@/hooks';
import { getTodayDate, calculateTotals } from '@/utils';
import { productsService } from '@/services';
import type { DayType } from '@/types';
import { AddMealModal } from './AddMealModal';
import { ProductsModal } from './ProductsModal';

type PageTab = 'today' | 'products';

export function JournalPage() {
  const { entries, addEntry, updateEntry, deleteEntry, getEntriesByDate } = useEntries();
  const { products, addProduct, updateProduct, deleteProduct, toggleFavorite, reloadProducts } = useProducts();
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState<PageTab>('today');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [dayType, setDayType] = useState<DayType>('rust');
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>();

  // Collapsible sections state - load from localStorage
  const [showHistoricalData, setShowHistoricalData] = useState(() => {
    const saved = localStorage.getItem('journal_show_historical_data');
    return saved !== null ? saved === 'true' : false;
  });

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('journal_show_historical_data', String(showHistoricalData));
  }, [showHistoricalData]);

  const todayEntries = getEntriesByDate(selectedDate);
  const totals = calculateTotals(todayEntries);

  // Calculate previous day data
  const previousDayData = useMemo(() => {
    const currentDate = new Date(selectedDate + 'T12:00:00');
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    const prevDateStr = previousDate.toISOString().split('T')[0];

    const prevEntries = getEntriesByDate(prevDateStr);
    const prevTotals = calculateTotals(prevEntries);

    return {
      date: prevDateStr,
      entries: prevEntries,
      totals: prevTotals,
    };
  }, [selectedDate, entries]);

  // Calculate last 7 days average
  const weekAverage = useMemo(() => {
    const currentDate = new Date(selectedDate + 'T12:00:00');
    const daysData = [];

    for (let i = 1; i <= 7; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayEntries = getEntriesByDate(dateStr);
      if (dayEntries.length > 0) {
        daysData.push(calculateTotals(dayEntries));
      }
    }

    if (daysData.length === 0) {
      return null;
    }

    const sum = daysData.reduce((acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbohydrates: acc.carbohydrates + day.carbohydrates,
      sugars: acc.sugars + day.sugars,
      fat: acc.fat + day.fat,
      saturatedFat: acc.saturatedFat + day.saturatedFat,
      fiber: acc.fiber + day.fiber,
      sodium: acc.sodium + day.sodium,
    }), {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      sugars: 0,
      fat: 0,
      saturatedFat: 0,
      fiber: 0,
      sodium: 0,
    });

    return {
      daysWithData: daysData.length,
      calories: Math.round(sum.calories / daysData.length),
      protein: (sum.protein / daysData.length).toFixed(1),
      carbohydrates: (sum.carbohydrates / daysData.length).toFixed(1),
      sugars: (sum.sugars / daysData.length).toFixed(1),
      fat: (sum.fat / daysData.length).toFixed(1),
      saturatedFat: (sum.saturatedFat / daysData.length).toFixed(1),
      fiber: (sum.fiber / daysData.length).toFixed(1),
      sodium: Math.round(sum.sodium / daysData.length),
    };
  }, [selectedDate, entries]);

  // Goals based on day type
  const goals = dayType === 'sport'
    ? { calories: settings.caloriesSport, protein: settings.proteinSport }
    : { calories: settings.caloriesRest, protein: settings.proteinRest };

  const limits = {
    carbohydrates: settings.carbohydratesMax,
    sugars: settings.sugarsMax,
    fat: settings.fatMax,
    saturatedFat: settings.saturatedFatMax,
    fiber: settings.fiberMin,
    sodium: settings.sodiumMax,
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'today'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Maaltijden
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'products'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Producten
            </button>
          </div>
        </div>

        {/* Today Tab Content */}
        {activeTab === 'today' && (
          <>
            {/* Dashboard Card */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Date & Day Type */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setDayType(dayType === 'rust' ? 'sport' : 'rust')}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  dayType === 'sport' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {dayType === 'sport' ? '💪 Sportdag' : '😴 Rustdag'}
              </button>
            </div>
          </div>

          {/* Compact 2x4 Grid - All Metrics (also on mobile) */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Calorieën */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Calorieën</div>
              <div className="relative w-full bg-gray-200 rounded-lg h-8 overflow-hidden">
                <div
                  className={`absolute inset-0 transition-all ${totals.calories > goals.calories ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min((totals.calories / goals.calories) * 100, 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {totals.calories} / {goals.calories}
                  </span>
                </div>
              </div>
            </div>

            {/* Eiwit */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Eiwit</div>
              <div className="relative w-full bg-gray-200 rounded-lg h-8 overflow-hidden">
                <div
                  className={`absolute inset-0 transition-all ${totals.protein < goals.protein ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((totals.protein / goals.protein) * 100, 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {totals.protein.toFixed(1)}g / {goals.protein}g
                  </span>
                </div>
              </div>
            </div>

            {/* Koolhydraten */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Koolhydraten</div>
              <div className="relative w-full bg-gray-200 rounded-lg h-8 overflow-hidden">
                <div
                  className={`absolute inset-0 transition-all ${totals.carbohydrates > limits.carbohydrates ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min((totals.carbohydrates / limits.carbohydrates) * 100, 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {totals.carbohydrates.toFixed(1)}g / {limits.carbohydrates}g
                  </span>
                </div>
              </div>
            </div>

            {/* Suikers */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Suikers</div>
              <div className="relative w-full bg-gray-200 rounded-lg h-8 overflow-hidden">
                <div
                  className={`absolute inset-0 transition-all ${totals.sugars > limits.sugars ? 'bg-red-500' : 'bg-yellow-500'}`}
                  style={{ width: `${Math.min((totals.sugars / limits.sugars) * 100, 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {totals.sugars.toFixed(1)}g / {limits.sugars}g
                  </span>
                </div>
              </div>
            </div>

            {/* Totaal vet */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Totaal vet</div>
              <div className="relative w-full bg-gray-200 rounded-lg h-8 overflow-hidden">
                <div
                  className={`absolute inset-0 transition-all ${totals.fat > limits.fat ? 'bg-red-500' : 'bg-gray-500'}`}
                  style={{ width: `${Math.min((totals.fat / limits.fat) * 100, 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {totals.fat.toFixed(1)}g / {limits.fat}g
                  </span>
                </div>
              </div>
            </div>

            {/* Verzadigd vet */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Verzadigd vet</div>
              <div className="relative w-full bg-gray-200 rounded-lg h-8 overflow-hidden">
                <div
                  className={`absolute inset-0 transition-all ${totals.saturatedFat > limits.saturatedFat ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((totals.saturatedFat / limits.saturatedFat) * 100, 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {totals.saturatedFat.toFixed(1)}g / {limits.saturatedFat}g
                  </span>
                </div>
              </div>
            </div>

            {/* Vezels */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Vezels</div>
              <div className="relative w-full bg-gray-200 rounded-lg h-8 overflow-hidden">
                <div
                  className={`absolute inset-0 transition-all ${totals.fiber < limits.fiber ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((totals.fiber / limits.fiber) * 100, 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {totals.fiber.toFixed(1)}g / {limits.fiber}g
                  </span>
                </div>
              </div>
            </div>

            {/* Natrium */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Natrium</div>
              <div className="relative w-full bg-gray-200 rounded-lg h-8 overflow-hidden">
                <div
                  className={`absolute inset-0 transition-all ${totals.sodium > limits.sodium ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((totals.sodium / limits.sodium) * 100, 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {totals.sodium}mg / {limits.sodium}mg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={() => setShowAddMeal(true)} className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 w-full">
              ➕ Maaltijd toevoegen
            </button>
          </div>
        </div>

        {/* Today's Meals */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Maaltijden</h2>
          {todayEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nog geen maaltijden toegevoegd</p>
          ) : (
            <div className="space-y-3">
              {todayEntries.map(entry => (
                <div key={entry.id} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800">{entry.time} - {entry.name}</div>
                      <div className="text-xs text-gray-500 mt-1 break-words">
                        {entry.calories} kcal • {entry.protein}g eiw • {entry.carbohydrates}g koolh • {entry.sugars}g suik • {entry.saturatedFat}g v.vet • {entry.fiber}g vez • {entry.sodium}mg natr
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingEntry(entry);
                          setShowAddMeal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-lg"
                        aria-label="Bewerk maaltijd"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Verwijder deze maaltijd?')) {
                            deleteEntry(entry.id!);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-lg"
                        aria-label="Verwijder maaltijd"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Historical Data Section - Collapsible */}
          {(previousDayData.entries.length > 0 || weekAverage) && (
            <div className="mt-6 border-t pt-4">
              <button
                onClick={() => setShowHistoricalData(!showHistoricalData)}
                className="flex items-center justify-between w-full px-3 py-2 mb-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle historische data"
              >
                <span className="text-sm font-medium text-gray-700">Historische data</span>
                <span className="text-gray-500 text-lg transition-transform" style={{ transform: showHistoricalData ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>

              {showHistoricalData && (
                <div className="space-y-4">
                  {/* Previous Day */}
                  {previousDayData.entries.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-800">
                          Gisteren ({new Date(previousDayData.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })})
                        </h4>
                        <span className="text-sm text-gray-600">{previousDayData.entries.length} maaltijden</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Calorieën:</span>
                          <span className="font-semibold ml-1">{previousDayData.totals.calories}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Eiwit:</span>
                          <span className="font-semibold ml-1">{previousDayData.totals.protein.toFixed(1)}g</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Koolh.:</span>
                          <span className="font-semibold ml-1">{previousDayData.totals.carbohydrates.toFixed(1)}g</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Vezels:</span>
                          <span className="font-semibold ml-1">{previousDayData.totals.fiber.toFixed(1)}g</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Last Week Average */}
                  {weekAverage && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-800">Gemiddelde afgelopen week</h4>
                        <span className="text-sm text-gray-600">{weekAverage.daysWithData} van 7 dagen</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Calorieën:</span>
                          <span className="font-semibold ml-1">{weekAverage.calories}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Eiwit:</span>
                          <span className="font-semibold ml-1">{weekAverage.protein}g</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Koolh.:</span>
                          <span className="font-semibold ml-1">{weekAverage.carbohydrates}g</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Vezels:</span>
                          <span className="font-semibold ml-1">{weekAverage.fiber}g</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
          </>
        )}

        {/* Products Tab Content */}
        {activeTab === 'products' && (
          <ProductsModal
            isOpen={true}
            onClose={() => {}} // No-op since we don't close inline view
            products={products}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
            onToggleFavorite={toggleFavorite}
            onImportJson={async (json) => {
              const data = JSON.parse(json);
              const productsToMerge = Array.isArray(data) ? data : [data];
              const result = await productsService.mergeProducts(productsToMerge);
              alert(`${result.added} toegevoegd, ${result.updated} bijgewerkt!`);
              await reloadProducts();
            }}
            inline={true}
          />
        )}

        {/* Modals */}
        <AddMealModal
          isOpen={showAddMeal}
          onClose={() => {
            setShowAddMeal(false);
            setEditingEntry(undefined);
          }}
          onAddMeal={addEntry}
          onUpdateMeal={updateEntry}
          editEntry={editingEntry}
          products={products}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}

export default JournalPage;
