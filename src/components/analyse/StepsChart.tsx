/**
 * StepsChart - Intraday steps visualization
 * Shows steps samples for a single day with time on X-axis and step count on Y-axis
 * Uses bar chart to clearly show active vs inactive periods
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import type { DayStepsSamples, StepsSample } from '@/types';

interface StepsChartProps {
  data: DayStepsSamples;
  onClose: () => void;
}

export function StepsChart({ data, onClose }: StepsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isExpanded, setIsExpanded] = useState(false);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!data || !data.samples || data.samples.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Stappen Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <p className="text-gray-500 dark:text-gray-400">Geen stappen data beschikbaar voor deze dag.</p>
      </div>
    );
  }

  // Calculate chart dimensions and scales
  const chartHeight = 300;
  const collapsedPanelWidth = 48;
  const chartWidth = containerWidth - collapsedPanelWidth + 18;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find max for Y scale
  const maxSteps = data.maxSteps || Math.max(...data.samples.map(s => s.count));
  const yMax = Math.ceil(maxSteps * 1.1 / 100) * 100; // Round up to nearest 100

  // X scale: time of day (00:00 to 23:59)
  const dayStart = new Date(data.date + 'T00:00:00').getTime();
  const dayEnd = new Date(data.date + 'T23:59:59').getTime();
  const timeRange = dayEnd - dayStart;

  // Scale functions
  const xScale = (timestamp: number) => {
    const timeSinceMidnight = timestamp - dayStart;
    return padding.left + (timeSinceMidnight / timeRange) * innerWidth;
  };

  const yScale = (count: number) => {
    return padding.top + innerHeight - (count / yMax) * innerHeight;
  };

  // Calculate bar width based on number of samples
  const barWidth = Math.max(2, innerWidth / data.samples.length);

  // Memoize Y-axis labels
  const yLabels = useMemo(() => {
    const labels = [];
    const yStep = yMax <= 500 ? 100 : yMax <= 1000 ? 200 : 500;
    for (let count = 0; count <= yMax; count += yStep) {
      labels.push(count);
    }
    return labels;
  }, [yMax]);

  // Memoize X-axis labels
  const xLabels = useMemo(() => {
    const labels = [];
    for (let hour = 0; hour <= 24; hour += 3) {
      const timestamp = dayStart + hour * 3600 * 1000;
      labels.push({
        label: `${hour.toString().padStart(2, '0')}:00`,
        x: xScale(timestamp),
      });
    }
    return labels;
  }, [dayStart, containerWidth]);

  // Calculate hourly statistics
  const hourlyStats = useMemo(() => {
    const hours = new Array(24).fill(0);
    data.samples.forEach((sample: StepsSample) => {
      const date = new Date(sample.timestamp);
      const hour = date.getHours();
      hours[hour] += sample.count;
    });

    const mostActiveHour = hours.indexOf(Math.max(...hours));
    const totalSteps = hours.reduce((sum, count) => sum + count, 0);
    const activeHours = hours.filter(count => count > 0).length;

    return {
      hours,
      mostActiveHour,
      totalSteps,
      activeHours,
      avgStepsPerActiveHour: activeHours > 0 ? Math.round(totalSteps / activeHours) : 0,
    };
  }, [data.samples]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            👣 Stappen - {new Date(data.date).toLocaleDateString('nl-NL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {data.sampleCount} metingen • Totaal: {data.totalSteps.toLocaleString()} stappen • Max: {data.maxSteps} stappen/periode
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Chart and Statistics Container */}
      <div className="relative">
        {/* Chart */}
        <div className="w-full" ref={containerRef}>
          <svg
            width={chartWidth}
            height={chartHeight}
          >
            <defs>
              <linearGradient id="stepsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 0.6 }} />
              </linearGradient>
            </defs>

            {/* Grid lines (horizontal) */}
            {yLabels.map(count => (
              <line
                key={`grid-${count}`}
                x1={padding.left}
                y1={yScale(count)}
                x2={chartWidth - padding.right}
                y2={yScale(count)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}

            {/* Bars */}
            {data.samples.map((sample: StepsSample, i: number) => {
              const x = xScale(sample.timestamp);
              const barHeight = innerHeight - (yScale(sample.count) - padding.top);

              if (sample.count === 0) return null; // Skip bars with 0 steps

              return (
                <rect
                  key={i}
                  x={x - barWidth / 2}
                  y={yScale(sample.count)}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#stepsGradient)"
                  className="hover:opacity-80 transition-opacity"
                >
                  <title>
                    {new Date(sample.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}: {sample.count} stappen
                  </title>
                </rect>
              );
            })}

            {/* Y-axis */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={chartHeight - padding.bottom}
              stroke="#9ca3af"
              strokeWidth="2"
            />

            {/* Y-axis labels */}
            {yLabels.map(count => (
              <text
                key={`y-label-${count}`}
                x={padding.left - 10}
                y={yScale(count)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-gray-600"
              >
                {count}
              </text>
            ))}

            {/* Y-axis label */}
            <text
              x={padding.left - 45}
              y={chartHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, ${padding.left - 45}, ${chartHeight / 2})`}
              className="text-sm fill-gray-700 font-medium"
            >
              Stappen
            </text>

            {/* X-axis */}
            <line
              x1={padding.left}
              y1={chartHeight - padding.bottom}
              x2={chartWidth - padding.right}
              y2={chartHeight - padding.bottom}
              stroke="#9ca3af"
              strokeWidth="2"
            />

            {/* X-axis labels */}
            {xLabels.map(({ label, x }) => (
              <text
                key={`x-label-${label}`}
                x={x}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {label}
              </text>
            ))}

            {/* X-axis label */}
            <text
              x={chartWidth / 2}
              y={chartHeight - 5}
              textAnchor="middle"
              className="text-sm fill-gray-700 font-medium"
            >
              Tijd
            </text>
          </svg>
        </div>

        {/* Collapsible Hourly Statistics Panel */}
        <div
          className={`absolute top-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
            isExpanded ? 'w-56 p-3' : 'w-12 p-2'
          }`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2"
            title={isExpanded ? 'Inklappen' : 'Uitklappen'}
          >
            <span className="text-lg">{isExpanded ? '→' : '←'}</span>
          </button>

          {isExpanded ? (
            /* Expanded: Full details */
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Statistieken</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">Totaal Stappen</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {hourlyStats.totalSteps.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">Actieve Uren</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {hourlyStats.activeHours} / 24
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">Ø per Actief Uur</div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {hourlyStats.avgStepsPerActiveHour.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">Meest Actief</div>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {hourlyStats.mostActiveHour}:00 - {hourlyStats.mostActiveHour + 1}:00
                  </div>
                  <div className="text-[9px] text-gray-500 dark:text-gray-400">
                    {hourlyStats.hours[hourlyStats.mostActiveHour].toLocaleString()} stappen
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Collapsed: Key stat only */
            <div className="flex flex-col items-center space-y-2">
              <div className="text-center">
                <div className="text-[9px] text-gray-600 dark:text-gray-400">Totaal</div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {(hourlyStats.totalSteps / 1000).toFixed(1)}k
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-gray-600 dark:text-gray-400">Actief</div>
                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                  {hourlyStats.activeHours}u
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
