/**
 * useWeights Hook
 *
 * React hook voor het beheren van gewicht tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { weightsService } from '@/services/weights.service';
import { syncService } from '@/services/sync.service';
import type { Weight } from '@/types';

export function useWeights() {
  const [weights, setWeights] = useState<Weight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Laad alle gewichten bij mount
  const loadWeights = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedWeights = await weightsService.getAllWeights();
      setWeights(loadedWeights);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to load weights:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeights();
  }, [loadWeights]);

  // Voeg nieuw gewicht toe
  const addWeight = useCallback(async (weight: Omit<Weight, 'id' | 'created_at'>) => {
    try {
      await weightsService.addWeight(weight);
      await loadWeights();

      // Trigger auto-sync if enabled
      syncService.triggerAutoSync();
    } catch (err) {
      console.error('❌ Failed to add weight:', err);
      setError(err as Error);
      throw err;
    }
  }, [loadWeights]);

  // Update bestaand gewicht
  const updateWeight = useCallback(async (id: string, updates: Partial<Omit<Weight, 'id' | 'created_at'>>) => {
    try {
      await weightsService.updateWeight(id, updates);
      await loadWeights();

      // Trigger auto-sync if enabled
      syncService.triggerAutoSync();
    } catch (err) {
      console.error('❌ Failed to update weight:', err);
      setError(err as Error);
      throw err;
    }
  }, [loadWeights]);

  // Verwijder gewicht
  const deleteWeight = useCallback(async (id: string) => {
    try {
      await weightsService.deleteWeight(id);
      await loadWeights();

      // Trigger auto-sync if enabled
      syncService.triggerAutoSync();
    } catch (err) {
      console.error('❌ Failed to delete weight:', err);
      setError(err as Error);
      throw err;
    }
  }, [loadWeights]);

  // Haal meest recente gewicht op
  const getLatestWeight = useCallback((): Weight | undefined => {
    return weights[0]; // Al gesorteerd op datum (nieuwste eerst)
  }, [weights]);

  // Haal gewichten op voor datum range
  const getWeightsByDateRange = useCallback((startDate: string, endDate: string): Weight[] => {
    return weights.filter(w => w.date >= startDate && w.date <= endDate);
  }, [weights]);

  // Reload weights (bijv. na import)
  const reloadWeights = useCallback(async () => {
    await loadWeights();
  }, [loadWeights]);

  return {
    weights,
    isLoading,
    error,
    addWeight,
    updateWeight,
    deleteWeight,
    getLatestWeight,
    getWeightsByDateRange,
    reloadWeights,
  };
}

export default useWeights;
