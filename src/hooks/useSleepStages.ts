/**
 * useSleepStages Hook - Beheer sleep stages (intraday sleep data)
 */

import { useState, useEffect, useCallback } from 'react';
import { sleepStagesService } from '@/services/sleep-stages.service';
import type { DaySleepStages } from '@/types';

export function useSleepStages() {
  const [stages, setStages] = useState<DaySleepStages[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sleepStagesService.getAllStages();
      setStages(data);
    } catch (error) {
      console.error('Failed to load sleep stages:', error);
      setStages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStages();

    // Listen for sync events to refresh data
    const handleSync = () => {
      console.log('🔄 useSleepStages: Reloading after sync');
      loadStages();
    };
    window.addEventListener('data-synced', handleSync);

    return () => {
      window.removeEventListener('data-synced', handleSync);
    };
  }, []);

  const getStagesByDate = useCallback((date: string) => {
    return stages.find(s => s.date === date);
  }, [stages]);

  const getStagesBetweenDates = useCallback((startDate: string, endDate: string) => {
    return stages.filter(s => s.date >= startDate && s.date <= endDate);
  }, [stages]);

  // Get date map for quick lookups (used in heatmap)
  const getStagesMap = useCallback(() => {
    return new Map(stages.map(s => [s.date, s]));
  }, [stages]);

  return {
    stages,
    isLoading,
    getStagesByDate,
    getStagesBetweenDates,
    getStagesMap,
    reloadStages: loadStages,
  };
}
