/**
 * useStepsSamples Hook
 *
 * React hook for managing intraday steps samples data
 * Provides loading, filtering, and mapping utilities
 */

import { useState, useEffect, useCallback } from 'react';
import { stepsSamplesService } from '@/services/steps-samples.service';
import type { DayStepsSamples } from '@/types';

export function useStepsSamples() {
  const [samples, setSamples] = useState<DayStepsSamples[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSamples = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await stepsSamplesService.getAllSamples();
      setSamples(data);
    } catch (error) {
      console.error('Failed to load steps samples:', error);
      setSamples([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSamples();

    // Listen for sync events to refresh data
    const handleSync = () => {
      console.log('🔄 useStepsSamples: Reloading after sync');
      loadSamples();
    };
    window.addEventListener('data-synced', handleSync);

    return () => {
      window.removeEventListener('data-synced', handleSync);
    };
  }, [loadSamples]);

  const getSamplesByDate = useCallback((date: string) => {
    return samples.find(s => s.date === date);
  }, [samples]);

  const getSamplesBetweenDates = useCallback((startDate: string, endDate: string) => {
    return samples.filter(s => s.date >= startDate && s.date <= endDate);
  }, [samples]);

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
