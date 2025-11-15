/**
 * useAggregates Hook
 *
 * Provides weekly and monthly aggregated nutrition and activity data
 * with automatic memoization for performance optimization.
 */

import { useMemo } from 'react';
import { useEntries } from './useEntries';
import { useActivities } from './useActivities';
import { useSettings } from './useSettings';
import { aggregationService } from '@/services/aggregation.service';
import type { WeekAggregate, MonthAggregate, AggregatePeriod } from '@/types';

interface UseAggregatesOptions {
  period?: AggregatePeriod;
  startDate?: string;
  endDate?: string;
  includeActivity?: boolean;
}

interface UseAggregatesResult {
  weeklyAggregates: WeekAggregate[];
  monthlyAggregates: MonthAggregate[];
  isLoading: boolean;
  error?: string;
}

/**
 * Custom hook to compute weekly and monthly aggregates from entries and activities
 *
 * @param options Configuration options for aggregation
 * @returns Aggregated weekly and monthly data with loading state
 */
export function useAggregates(options: UseAggregatesOptions = {}): UseAggregatesResult {
  const {
    period = '12weeks',
    startDate: customStartDate,
    endDate: customEndDate,
    includeActivity = true,
  } = options;

  // Get data from existing hooks
  const { entries, loading: entriesLoading } = useEntries();
  const { activities, loading: activitiesLoading } = useActivities();
  const { settings, loading: settingsLoading } = useSettings();

  // Determine date range
  const { startDate, endDate } = useMemo(() => {
    if (customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    return aggregationService.getDateRangeForPeriod(period);
  }, [period, customStartDate, customEndDate]);

  // Calculate weekly aggregates with memoization
  const weeklyAggregates = useMemo(() => {
    if (!entries || !settings || entriesLoading || settingsLoading) {
      return [];
    }

    const activitiesToUse = includeActivity ? (activities || []) : [];

    return aggregationService.calculateWeeklyAggregates(
      entries,
      activitiesToUse,
      settings,
      startDate,
      endDate
    );
  }, [entries, activities, settings, startDate, endDate, includeActivity, entriesLoading, settingsLoading, activitiesLoading]);

  // Calculate monthly aggregates with memoization
  const monthlyAggregates = useMemo(() => {
    if (!entries || !settings || entriesLoading || settingsLoading) {
      return [];
    }

    const activitiesToUse = includeActivity ? (activities || []) : [];

    return aggregationService.calculateMonthlyAggregates(
      entries,
      activitiesToUse,
      settings,
      startDate,
      endDate
    );
  }, [entries, activities, settings, startDate, endDate, includeActivity, entriesLoading, settingsLoading, activitiesLoading]);

  // Determine loading state
  const isLoading = entriesLoading || settingsLoading || (includeActivity && activitiesLoading);

  return {
    weeklyAggregates,
    monthlyAggregates,
    isLoading,
  };
}
