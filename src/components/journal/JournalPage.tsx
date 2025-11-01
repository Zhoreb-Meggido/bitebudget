/**
 * JournalPage - Main meal tracking component
 */

import React, { useState } from 'react';
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

          {/* Nutrition Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
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
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Vezels</div>
              <div className={`text-2xl font-bold ${totals.fiber < limits.fiber ? 'text-orange-600' : 'text-green-600'}`}>
                {totals.fiber.toFixed(1)}g
              </div>
              <div className="text-xs text-gray-500">Min: {limits.fiber}g</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Verzadigd vet</div>
              <div className={`text-2xl font-bold ${totals.saturatedFat > limits.saturatedFat ? 'text-red-600' : 'text-green-600'}`}>
                {totals.saturatedFat.toFixed(1)}g
              </div>
              <div className="text-xs text-gray-500">Max: {limits.saturatedFat}g</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Natrium</div>
              <div className={`text-2xl font-bold ${totals.sodium > limits.sodium ? 'text-red-600' : 'text-green-600'}`}>
                {totals.sodium}mg
              </div>
              <div className="text-xs text-gray-500">Max: {limits.sodium}mg</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Totaal vet</div>
              <div className="text-2xl font-bold text-gray-700">
                {totals.fat.toFixed(1)}g
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
            <p className="text-gray-500 text-center py-8">Nog geen maaltijden toegevoegd</p>
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
