/**
 * JournalPage - Main meal tracking component
 */

import React, { useState, useMemo } from 'react';
import { useEntries, useProducts, useSettings } from '@/hooks';
import { getTodayDate, calculateTotals } from '@/utils';
import { productsService } from '@/services';
import type { DayType } from '@/types';
import { AddMealModal } from './AddMealModal';
import { ProductsModal } from './ProductsModal';

export function JournalPage() {
  const { entries, addEntry, deleteEntry, getEntriesByDate } = useEntries();
  const { products, addProduct, updateProduct, deleteProduct, toggleFavorite, reloadProducts } = useProducts();
  const { settings } = useSettings();

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [dayType, setDayType] = useState<DayType>('rust');
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

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
    saturatedFat: settings.saturatedFatMax,
    fiber: settings.fiberMin,
    sodium: settings.sodiumMax,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
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

          {/* Nutrition Overview - Hybrid Layout */}
          {/* Top 3 Cards: Most Important Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Calorieën</div>
              <div className={`text-2xl font-bold ${totals.calories > goals.calories ? 'text-red-600' : 'text-blue-600'}`}>
                {totals.calories}
              </div>
              <div className="text-xs text-gray-500">Max: {goals.calories}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Eiwit</div>
              <div className={`text-2xl font-bold ${totals.protein < goals.protein ? 'text-orange-600' : 'text-green-600'}`}>
                {totals.protein.toFixed(1)}g
              </div>
              <div className="text-xs text-gray-500">Doel: {goals.protein}g</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Koolhydraten</div>
              <div className="text-2xl font-bold text-amber-600">
                {totals.carbohydrates.toFixed(1)}g
              </div>
              <div className="text-xs text-gray-500">Totaal</div>
            </div>
          </div>

          {/* Progress Bars: Secondary Metrics */}
          <div className="space-y-3 mb-6">
            {/* Sugars */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Suikers</span>
                <span className="font-medium text-gray-700">{totals.sugars.toFixed(1)}g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: '50%' }}
                ></div>
              </div>
            </div>

            {/* Total Fat */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Totaal vet</span>
                <span className="font-medium text-gray-700">{totals.fat.toFixed(1)}g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full transition-all"
                  style={{ width: '50%' }}
                ></div>
              </div>
            </div>

            {/* Saturated Fat */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Verzadigd vet</span>
                <span className={`font-medium ${totals.saturatedFat > limits.saturatedFat ? 'text-red-600' : 'text-green-600'}`}>
                  {totals.saturatedFat.toFixed(1)}g / {limits.saturatedFat}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${totals.saturatedFat > limits.saturatedFat ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((totals.saturatedFat / limits.saturatedFat) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Fiber */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Vezels</span>
                <span className={`font-medium ${totals.fiber < limits.fiber ? 'text-orange-600' : 'text-green-600'}`}>
                  {totals.fiber.toFixed(1)}g / {limits.fiber}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${totals.fiber < limits.fiber ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((totals.fiber / limits.fiber) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Sodium */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Natrium</span>
                <span className={`font-medium ${totals.sodium > limits.sodium ? 'text-red-600' : 'text-green-600'}`}>
                  {totals.sodium}mg / {limits.sodium}mg
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${totals.sodium > limits.sodium ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((totals.sodium / limits.sodium) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={() => setShowAddMeal(true)} className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 w-full sm:w-auto">
              ➕ Maaltijd toevoegen
            </button>
            <button onClick={() => setShowProducts(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 w-full sm:w-auto">
              📦 Producten beheren
            </button>
          </div>
        </div>

        {/* Today's Meals */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Maaltijden vandaag</h2>
          {todayEntries.length === 0 ? (
            <div>
              <p className="text-gray-500 text-center py-4">Nog geen maaltijden toegevoegd</p>

              {/* Historical Data Section */}
              {(previousDayData.entries.length > 0 || weekAverage) && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Historische data</h3>

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
                    <button
                      onClick={() => {
                        if (confirm('Verwijder deze maaltijd?')) {
                          deleteEntry(entry.id!);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-lg flex-shrink-0"
                      aria-label="Verwijder maaltijd"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        <AddMealModal
          isOpen={showAddMeal}
          onClose={() => setShowAddMeal(false)}
          onAddMeal={addEntry}
          products={products}
          selectedDate={selectedDate}
        />

        <ProductsModal
          isOpen={showProducts}
          onClose={() => setShowProducts(false)}
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
        />
      </div>
    </div>
  );
}

export default JournalPage;
