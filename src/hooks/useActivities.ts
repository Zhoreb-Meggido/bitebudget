/**
 * useActivities Hook - Beheer daily activities (Garmin data)
 */

import { useState, useEffect, useCallback } from 'react';
import { activitiesService } from '@/services/activities.service';
import type { DailyActivity } from '@/types';
import { scrollPositionManager } from '@/utils/scroll-position.utils';

export function useActivities() {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    const data = await activitiesService.getAllActivities();
    setActivities(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadActivities();

    // Listen for sync events to refresh data
    const handleSync = async () => {
      console.log('🔄 useActivities: Reloading after sync');
      scrollPositionManager.savePosition('activities-sync');
      await loadActivities();
      setTimeout(() => scrollPositionManager.restorePosition('activities-sync'), 100);
    };
    window.addEventListener('data-synced', handleSync);

    return () => {
      window.removeEventListener('data-synced', handleSync);
    };
  }, []); // Empty deps - loadActivities is stable via useCallback

  const getActivityByDate = useCallback((date: string) => {
    return activities.find(a => a.date === date);
  }, [activities]);

  const getActivitiesBetweenDates = useCallback((startDate: string, endDate: string) => {
    return activities.filter(a => a.date >= startDate && a.date <= endDate);
  }, [activities]);

  return {
    activities,
    isLoading,
    getActivityByDate,
    getActivitiesBetweenDates,
    reloadActivities: loadActivities,
  };
}
