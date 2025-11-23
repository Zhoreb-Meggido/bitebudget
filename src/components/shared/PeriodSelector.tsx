import { useState, useMemo, useEffect } from 'react';
import type { Entry } from '@/types';
import { downloadCSVReport } from '@/utils/export.utils';
import { generatePdfReport, type ReportOptions, exportDailyAggregatesToCSV, exportWeeklyAggregatesToCSV, exportMonthlyAggregatesToCSV } from '@/utils/report.utils';
import { useAggregates } from '@/hooks/useAggregates';
import { useActivities } from '@/hooks/useActivities';

export type TimeRange = '7' | '14' | '28' | '90' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'all' | 'custom' | 'custom-months';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface PeriodSelectorProps {
  entries: Entry[];
  showExportButtons?: boolean;
  defaultTimeRange?: TimeRange;
  onPeriodChange?: (range: DateRange, filteredEntries: Entry[]) => void;
}

export function PeriodSelector({
  entries,
  showExportButtons = false,
  defaultTimeRange = '30',
  onPeriodChange,
}: PeriodSelectorProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  // Generate list of last 18 months for month selector
  const getAvailableMonths = (): { value: string; label: string }[] => {
    const months: { value: string; label: string }[] = [];
    const today = new Date();

    for (let i = 0; i < 18; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }

    return months;
  };

  // Toggle month selection
  const toggleMonth = (monthValue: string) => {
    setSelectedMonths(prev =>
      prev.includes(monthValue)
        ? prev.filter(m => m !== monthValue)
        : [...prev, monthValue].sort().reverse() // Keep sorted, newest first
    );
  };

  // Calculate date range based on selected time range
  const dateRange = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let startDate: string;
    let endDate: string;

    switch (timeRange) {
      case '7': {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - 6);
        startDate = date.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case '14': {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - 13);
        startDate = date.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case '28': {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - 27);
        startDate = date.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case '90': {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - 89);
        startDate = date.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case 'this-week': {
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startDate = monday.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case 'last-week': {
        const dayOfWeek = today.getDay();
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        startDate = lastMonday.toISOString().split('T')[0];
        endDate = lastSunday.toISOString().split('T')[0];
        break;
      }
      case 'this-month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = yesterdayStr;
        break;
      }
      case 'last-month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
        break;
      }
      case 'all': {
        // Get earliest and latest date from entries (excluding today)
        const allDates = entries.map(e => e.date).filter(d => d < today.toISOString().split('T')[0]).sort();
        startDate = allDates[0] || yesterdayStr;
        endDate = allDates[allDates.length - 1] || yesterdayStr;
        break;
      }
      case 'custom': {
        startDate = customStartDate || yesterdayStr;
        endDate = customEndDate || yesterdayStr;
        break;
      }
      case 'custom-months': {
        // Calculate actual date range from selected months
        if (selectedMonths.length === 0) {
          // No months selected - use yesterday as dummy
          startDate = yesterdayStr;
          endDate = yesterdayStr;
        } else {
          // Sort months to get earliest and latest
          const sortedMonths = [...selectedMonths].sort();
          const firstMonth = sortedMonths[0]; // e.g., "2024-11"
          const lastMonth = sortedMonths[sortedMonths.length - 1];

          // Parse first month to get start date (first day of month)
          const [startYear, startMonth] = firstMonth.split('-').map(Number);
          const firstDay = new Date(startYear, startMonth - 1, 1);
          startDate = firstDay.toISOString().split('T')[0];

          // Parse last month to get end date (last day of month)
          const [endYear, endMonth] = lastMonth.split('-').map(Number);
          const lastDay = new Date(endYear, endMonth, 0); // Day 0 = last day of previous month
          endDate = lastDay.toISOString().split('T')[0];
        }
        break;
      }
      default: {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - 27);
        startDate = date.toISOString().split('T')[0];
        endDate = yesterdayStr;
      }
    }

    return { startDate, endDate };
  }, [timeRange, customStartDate, customEndDate, selectedMonths, entries]);

  // Get activities for daily CSV export
  const { activities } = useActivities();

  // Get aggregates for CSV export (weekly for 90-365 days, monthly for > 365 days)
  const { weeklyAggregates, monthlyAggregates } = useAggregates({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    includeActivity: true,
  });

  // Filter entries based on date range
  const filteredEntries = useMemo(() => {
    if (timeRange === 'all') {
      return entries;
    }
    // custom-months doesn't use normal date filtering (handled in PDF export)
    if (timeRange === 'custom-months') {
      return entries; // Return all for now, filtering happens in generatePdfReport
    }
    return entries.filter(e => e.date >= dateRange.startDate && e.date <= dateRange.endDate);
  }, [entries, dateRange, timeRange]);

  // Notify parent component when period changes
  useEffect(() => {
    if (onPeriodChange) {
      onPeriodChange(dateRange, filteredEntries);
    }
  }, [dateRange, filteredEntries, onPeriodChange]);

  // Handle export
  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      if (filteredEntries.length === 0) {
        alert('Geen data beschikbaar voor de geselecteerde periode.');
        return;
      }

      // Determine export format based on date range
      const daysDiff = Math.ceil(
        (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 90) {
        // Daily aggregates with activity data (≤ 90 days)
        exportDailyAggregatesToCSV(filteredEntries, activities, dateRange.startDate, dateRange.endDate);
      } else if (daysDiff <= 365) {
        // Weekly aggregates (90-365 days)
        if (weeklyAggregates.length === 0) {
          alert('Geen week data beschikbaar voor de geselecteerde periode.');
          return;
        }
        exportWeeklyAggregatesToCSV(weeklyAggregates);
      } else {
        // Monthly aggregates (> 365 days)
        if (monthlyAggregates.length === 0) {
          alert('Geen maand data beschikbaar voor de geselecteerde periode.');
          return;
        }
        exportMonthlyAggregatesToCSV(monthlyAggregates);
      }
    } else {
      // PDF export using unified report.utils.ts
      let reportOptions: ReportOptions;

      if (timeRange === 'custom-months') {
        if (selectedMonths.length === 0) {
          alert('Selecteer minimaal één maand voor maandrapportage.');
          return;
        }
        reportOptions = { months: selectedMonths };
      } else if (['7', '14', '28', '90'].includes(timeRange)) {
        reportOptions = { days: parseInt(timeRange) };
      } else {
        reportOptions = { startDate: dateRange.startDate, endDate: dateRange.endDate };
      }

      generatePdfReport(entries, reportOptions);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {showExportButtons ? 'Rapportage' : 'Periode Selectie'}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
              {/* Dashboard mode: show visualization-friendly options */}
              {!showExportButtons && (
                <>
                  <option value="7">Laatste 7 dagen</option>
                  <option value="14">Laatste 14 dagen</option>
                  <option value="28">Laatste 28 dagen</option>
                  <option value="90">Laatste 90 dagen</option>
                  <option value="this-week">Deze week</option>
                  <option value="last-week">Vorige week</option>
                  <option value="this-month">Deze maand</option>
                  <option value="last-month">Vorige maand</option>
                  <option value="all">Alles</option>
                  <option value="custom">Aangepast</option>
                </>
              )}

              {/* Export mode: show export-friendly options */}
              {showExportButtons && (
                <>
                  <option value="7">Laatste week (7 dagen)</option>
                  <option value="14">Laatste 2 weken (14 dagen)</option>
                  <option value="28">Laatste 4 weken (28 dagen)</option>
                  <option value="this-week">Deze week</option>
                  <option value="last-week">Vorige week</option>
                  <option value="last-month">Vorige maand</option>
                  <option value="custom">Aangepast - Datumbereik</option>
                  <option value="custom-months">Aangepast - Maand(en)</option>
                </>
              )}
          </select>

          {/* Export Buttons - inline on desktop, below on mobile */}
          {showExportButtons && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-800 font-medium whitespace-nowrap"
              >
                📊 CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 font-medium whitespace-nowrap"
              >
                📄 PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">

        {/* Custom Date Range */}
        {timeRange === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Van
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tot
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Custom Month Selection */}
        {timeRange === 'custom-months' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Selecteer maand(en) voor maandrapportage
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900">
              {getAvailableMonths().map(month => (
                <label
                  key={month.value}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(month.value)}
                    onChange={() => toggleMonth(month.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{month.label}</span>
                </label>
              ))}
            </div>
            {selectedMonths.length > 0 && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {selectedMonths.length} maand(en) geselecteerd
              </p>
            )}
          </div>
        )}

        {/* Help text */}
        {showExportButtons && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Genereer een overzicht van je voedingsjournaal met alle 8 metrics. CSV voor Excel, PDF met weekoverzichten.
          </p>
        )}
      </div>
    </div>
  );
}
