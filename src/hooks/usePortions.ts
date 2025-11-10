/**
 * usePortions Hook - Beheer product portions
 */

import { useState, useEffect, useCallback } from 'react';
import { portionsService } from '@/services/portions.service';
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

  // Initial load when productName changes
  useEffect(() => {
    loadPortions();
  }, [loadPortions]);

  // Sync listener - only set up once
  useEffect(() => {
    const handleSync = () => {
      console.log('🔄 usePortions: Reloading after sync');
      loadPortions();
    };
    window.addEventListener('data-synced', handleSync);

    return () => {
      window.removeEventListener('data-synced', handleSync);
    };
  }, []); // Empty deps - listener set up once, loadPortions is stable

  const addPortion = useCallback(async (portion: Omit<ProductPortion, 'id' | 'created_at' | 'updated_at'>) => {
    const newPortion = await portionsService.addPortion(portion);

    if (productName && newPortion.productName === productName) {
      setPortions(prev => [...prev, newPortion]);
    }
    setAllPortions(prev => [...prev, newPortion]);

    return newPortion;
  }, [productName]);

  const updatePortion = useCallback(async (id: number | string, updates: Partial<ProductPortion>) => {
    await portionsService.updatePortion(id, updates);

    if (productName) {
      setPortions(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    }
    setAllPortions(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));

  }, [productName]);

  const deletePortion = useCallback(async (id: number | string) => {
    await portionsService.deletePortion(id);

    if (productName) {
      setPortions(prev => prev.filter(p => p.id !== id));
    }
    setAllPortions(prev => prev.filter(p => p.id !== id));

  }, [productName]);

  const setDefaultPortion = useCallback(async (portionId: number | string) => {
    await portionsService.setDefaultPortion(portionId);
    await loadPortions(); // Reload to get updated defaults

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
