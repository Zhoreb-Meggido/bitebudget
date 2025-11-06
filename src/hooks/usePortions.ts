/**
 * usePortions Hook - Beheer product portions
 */

import { useState, useEffect, useCallback } from 'react';
import { portionsService } from '@/services/portions.service';
import { syncService } from '@/services/sync.service';
import type { ProductPortion } from '@/types';

export function usePortions(productName?: string) {
  const [portions, setPortions] = useState<ProductPortion[]>([]);
  const [allPortions, setAllPortions] = useState<ProductPortion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPortions = useCallback(async () => {
    setIsLoading(true);

    // Initialize defaults on first load
    await portionsService.initializeDefaults();

    if (productName) {
      const data = await portionsService.getPortionsByProduct(productName);
      setPortions(data);
    } else {
      const data = await portionsService.getAllPortions();
      setAllPortions(data);
    }

    setIsLoading(false);
  }, [productName]);

  useEffect(() => {
    loadPortions();
  }, [loadPortions]);

  const addPortion = useCallback(async (portion: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>) => {
    const newPortion = await portionsService.addPortion(portion);

    if (productName && newPortion.productName === productName) {
      setPortions(prev => [...prev, newPortion]);
    }
    setAllPortions(prev => [...prev, newPortion]);

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();

    return newPortion;
  }, [productName]);

  const updatePortion = useCallback(async (id: number | string, updates: Partial<ProductPortion>) => {
    await portionsService.updatePortion(id, updates);

    if (productName) {
      setPortions(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    }
    setAllPortions(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();
  }, [productName]);

  const deletePortion = useCallback(async (id: number | string) => {
    await portionsService.deletePortion(id);

    if (productName) {
      setPortions(prev => prev.filter(p => p.id !== id));
    }
    setAllPortions(prev => prev.filter(p => p.id !== id));

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();
  }, [productName]);

  const setDefaultPortion = useCallback(async (productName: string, portionId: number | string) => {
    await portionsService.setDefaultPortion(productName, portionId);
    await loadPortions(); // Reload to get updated defaults

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();
  }, [loadPortions]);

  return {
    portions: productName ? portions : allPortions,
    isLoading,
    addPortion,
    updatePortion,
    deletePortion,
    setDefaultPortion,
    reloadPortions: loadPortions,
  };
}
