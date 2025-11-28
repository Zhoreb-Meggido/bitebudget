/**
 * useWaterEntries Hook
 *
 * React hook voor het beheren van water intake tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { waterEntriesService } from '@/services/water-entries.service';
import type { WaterEntry } from '@/types';
import { scrollPositionManager } from '@/utils/scroll-position.utils';

export function useWaterEntries() {
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Laad alle water entries bij mount
  const loadWaterEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedEntries = await waterEntriesService.getAllWaterEntries();
      setWaterEntries(loadedEntries);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to load water entries:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWaterEntries();

    // Listen for sync events to refresh data
    const handleSync = async () => {
      console.log('🔄 useWaterEntries: Reloading after sync');
      scrollPositionManager.savePosition('water-sync');
      await loadWaterEntries();
      setTimeout(() => scrollPositionManager.restorePosition('water-sync'), 100);
    };
    window.addEventListener('data-synced', handleSync);

    return () => {
      window.removeEventListener('data-synced', handleSync);
    };
  }, []); // Empty deps - loadWaterEntries is stable via useCallback

  // Voeg nieuw water entry toe
  const addWaterEntry = useCallback(async (entry: Omit<WaterEntry, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await waterEntriesService.addWaterEntry(entry);
      await loadWaterEntries();
    } catch (err) {
      console.error('❌ Failed to add water entry:', err);
      setError(err as Error);
      throw err;
    }
  }, [loadWaterEntries]);

  // Update bestaand water entry
  const updateWaterEntry = useCallback(async (id: string, updates: Partial<Omit<WaterEntry, 'id' | 'created_at'>>) => {
    try {
      await waterEntriesService.updateWaterEntry(id, updates);
      await loadWaterEntries();
    } catch (err) {
      console.error('❌ Failed to update water entry:', err);
      setError(err as Error);
      throw err;
    }
  }, [loadWaterEntries]);

  // Verwijder water entry
  const deleteWaterEntry = useCallback(async (id: string) => {
    try {
      await waterEntriesService.deleteWaterEntry(id);
      await loadWaterEntries();
    } catch (err) {
      console.error('❌ Failed to delete water entry:', err);
      setError(err as Error);
      throw err;
    }
  }, [loadWaterEntries]);

  // Haal water entries op voor een specifieke datum
  const getEntriesByDate = useCallback((date: string): WaterEntry[] => {
    return waterEntries.filter(e => e.date === date);
  }, [waterEntries]);

  // Haal water entries op voor een datum range
  const getEntriesByDateRange = useCallback((startDate: string, endDate: string): WaterEntry[] => {
    return waterEntries.filter(e => e.date >= startDate && e.date <= endDate);
  }, [waterEntries]);

  // Bereken totale water intake voor een specifieke datum
  const getTotalWaterByDate = useCallback((date: string): number => {
    const entries = getEntriesByDate(date);
    return entries.reduce((total, entry) => total + entry.amount, 0);
  }, [getEntriesByDate]);

  // Bereken totale water intake voor een datum range (per dag)
  const getTotalWaterByDateRange = useCallback((startDate: string, endDate: string): Record<string, number> => {
    const entries = getEntriesByDateRange(startDate, endDate);
    const totals: Record<string, number> = {};

    entries.forEach(entry => {
      if (!totals[entry.date]) {
        totals[entry.date] = 0;
      }
      totals[entry.date] += entry.amount;
    });

    return totals;
  }, [getEntriesByDateRange]);

  // Reload water entries (bijv. na import)
  const reloadWaterEntries = useCallback(async () => {
    await loadWaterEntries();
  }, [loadWaterEntries]);

  return {
    waterEntries,
    isLoading,
    error,
    addWaterEntry,
    updateWaterEntry,
    deleteWaterEntry,
    getEntriesByDate,
    getEntriesByDateRange,
    getTotalWaterByDate,
    getTotalWaterByDateRange,
    reloadWaterEntries,
  };
}

export default useWaterEntries;
