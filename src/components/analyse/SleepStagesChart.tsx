/**
 * SleepStagesChart - Visualisatie van slaapfases
 * Toont timeline van licht/diep/REM/wakker slaap voor één nacht
 */

import { useMemo } from 'react';
import { SleepStageType, type DaySleepStages } from '@/types';

interface SleepStagesChartProps {
  data: DaySleepStages;
  onClose: () => void;
}

const STAGE_COLORS: Record<SleepStageType, string> = {
  [SleepStageType.AWAKE]: '#ef4444',         // red
  [SleepStageType.SLEEPING]: '#6b7280',      // gray
  [SleepStageType.OUT_OF_BED]: '#9ca3af',    // light gray
  [SleepStageType.LIGHT]: '#60a5fa',         // blue
  [SleepStageType.DEEP]: '#3b82f6',          // dark blue
  [SleepStageType.REM]: '#8b5cf6',           // purple
  [SleepStageType.AWAKE_IN_BED]: '#f59e0b',  // orange
  [SleepStageType.UNKNOWN]: '#d1d5db',       // very light gray
};

const STAGE_NAMES: Record<SleepStageType, string> = {
  [SleepStageType.AWAKE]: 'Wakker',
  [SleepStageType.SLEEPING]: 'Slaap (algemeen)',
  [SleepStageType.OUT_OF_BED]: 'Uit bed',
  [SleepStageType.LIGHT]: 'Lichte slaap',
  [SleepStageType.DEEP]: 'Diepe slaap',
  [SleepStageType.REM]: 'REM slaap',
  [SleepStageType.AWAKE_IN_BED]: 'Wakker in bed',
  [SleepStageType.UNKNOWN]: 'Onbekend',
};

export function SleepStagesChart({ data, onClose }: SleepStagesChartProps) {
  if (!data || !data.stages || data.stages.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Slaap Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">×</button>
        </div>
        <p className="text-gray-500 dark:text-gray-400">Geen slaapfase data beschikbaar.</p>
      </div>
    );
  }

  // Memoize hour calculations
  const sleepHours = useMemo(() => ({
    total: data.totalSleepMs / 3600000,
    light: data.lightSleepMs / 3600000,
    deep: data.deepSleepMs / 3600000,
    rem: data.remSleepMs / 3600000,
    awake: data.awakeSleepMs / 3600000,
  }), [data.totalSleepMs, data.lightSleepMs, data.deepSleepMs, data.remSleepMs, data.awakeSleepMs]);

  const sleepStartTime = new Date(data.sleepStart);
  const sleepEndTime = new Date(data.sleepEnd);
  const duration = data.sleepEnd - data.sleepStart;

  // Format tijd
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  // Memoize timeline bars calculation
  const timelineBars = useMemo(() => {
    return data.stages.map((stage, idx) => {
      const stageStart = stage.startTime - data.sleepStart;
      const stageDuration = stage.endTime - stage.startTime;
      const left = (stageStart / duration) * 100;
      const width = (stageDuration / duration) * 100;

      return {
        key: idx,
        left,
        width,
        color: STAGE_COLORS[stage.stage],
        title: `${STAGE_NAMES[stage.stage]}: ${((stageDuration / 3600000).toFixed(1))}u`,
      };
    });
  }, [data.stages, data.sleepStart, duration]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">😴 Slaap Details</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {data.date} • {formatTime(sleepStartTime)} - {formatTime(sleepEndTime)}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">×</button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Totaal</div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{sleepHours.total.toFixed(1)}u</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-xs text-blue-600 dark:text-blue-400">Licht</div>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-300">{sleepHours.light.toFixed(1)}u</div>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
          <div className="text-xs text-indigo-600 dark:text-indigo-400">Diep</div>
          <div className="text-lg font-bold text-indigo-900 dark:text-indigo-300">{sleepHours.deep.toFixed(1)}u</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div className="text-xs text-purple-600 dark:text-purple-400">REM</div>
          <div className="text-lg font-bold text-purple-900 dark:text-purple-300">{sleepHours.rem.toFixed(1)}u</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <div className="text-xs text-red-600 dark:text-red-400">Wakker</div>
          <div className="text-lg font-bold text-red-900 dark:text-red-300">{sleepHours.awake.toFixed(1)}u</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Slaap Timeline</h4>
        <div className="relative h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          {timelineBars.map((bar) => (
            <div
              key={bar.key}
              className="absolute h-full transition-opacity hover:opacity-80"
              style={{
                left: `${bar.left}%`,
                width: `${bar.width}%`,
                backgroundColor: bar.color,
              }}
              title={bar.title}
            />
          ))}
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{formatTime(sleepStartTime)}</span>
          <span>{formatTime(sleepEndTime)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STAGE_COLORS[SleepStageType.LIGHT] }}></div>
          <span className="text-gray-600 dark:text-gray-400">Licht</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STAGE_COLORS[SleepStageType.DEEP] }}></div>
          <span className="text-gray-600 dark:text-gray-400">Diep</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STAGE_COLORS[SleepStageType.REM] }}></div>
          <span className="text-gray-600 dark:text-gray-400">REM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STAGE_COLORS[SleepStageType.AWAKE] }}></div>
          <span className="text-gray-600 dark:text-gray-400">Wakker</span>
        </div>
      </div>
    </div>
  );
}
