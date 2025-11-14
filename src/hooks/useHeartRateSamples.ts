/**
 * useHeartRateSamples Hook - Beheer heart rate samples (intraday HR data)
 */

import { useState, useEffect, useCallback } from 'react';
import { heartRateSamplesService } from '@/services/heart-rate-samples.service';
import type { DayHeartRateSamples } from '@/types';

export function useHeartRateSamples() {
  const [samples, setSamples] = useState<DayHeartRateSamples[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSamples = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await heartRateSamplesService.getAllSamples();
      setSamples(data);
    } catch (error) {
      console.error('Failed to load HR samples:', error);
      setSamples([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSamples();

    // Listen for sync events to refresh data
    const handleSync = () => {
      console.log('🔄 useHeartRateSamples: Reloading after sync');
      loadSamples();
    };
    window.addEventListener('data-synced', handleSync);

    return () => {
      window.removeEventListener('data-synced', handleSync);
    };
  }, []); // Empty deps - loadSamples is stable via useCallback

  const getSamplesByDate = useCallback((date: string) => {
    return samples.find(s => s.date === date);
  }, [samples]);

  const getSamplesBetweenDates = useCallback((startDate: string, endDate: string) => {
    return samples.filter(s => s.date >= startDate && s.date <= endDate);
  }, [samples]);

  // Get date map for quick lookups (used in heatmap)
  const getSamplesMap = useCallback(() => {
    return new Map(samples.map(s => [s.date, s]));
  }, [samples]);

  return {
    samples,
    isLoading,
    getSamplesByDate,
    getSamplesBetweenDates,
    getSamplesMap,
    reloadSamples: loadSamples,
  };
}
