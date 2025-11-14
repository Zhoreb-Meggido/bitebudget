/**
 * HeartRateChart - Intraday heart rate visualization
 * Shows ~680 HR samples for a single day with time on X-axis and BPM on Y-axis
 */

import { useRef, useState, useEffect } from 'react';
import type { DayHeartRateSamples } from '@/types';

interface HeartRateChartProps {
  data: DayHeartRateSamples;
  onClose: () => void;
}

export function HeartRateChart({ data, onClose }: HeartRateChartProps) {
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Hartslag Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <p className="text-gray-500">Geen hartslag data beschikbaar voor deze dag.</p>
      </div>
    );
  }

  // Calculate chart dimensions and scales
  const chartHeight = 300;
  const collapsedPanelWidth = 48; // Width of collapsed panel
  const chartWidth = containerWidth - collapsedPanelWidth - 4; // Fixed width, only account for collapsed panel
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find min/max for Y scale (with some padding)
  const minBpm = data.minBpm || Math.min(...data.samples.map(s => s.bpm));
  const maxBpm = data.maxBpm || Math.max(...data.samples.map(s => s.bpm));
  const bpmRange = maxBpm - minBpm;
  const yMin = Math.max(40, minBpm - bpmRange * 0.1); // Don't go below 40 bpm
  const yMax = maxBpm + bpmRange * 0.1;

  // X scale: time of day (00:00 to 23:59)
  const dayStart = new Date(data.date + 'T00:00:00').getTime();
  const dayEnd = new Date(data.date + 'T23:59:59').getTime();
  const timeRange = dayEnd - dayStart;

  // Scale functions
  const xScale = (timestamp: number) => {
    const timeSinceMidnight = timestamp - dayStart;
    return padding.left + (timeSinceMidnight / timeRange) * innerWidth;
  };

  const yScale = (bpm: number) => {
    return padding.top + innerHeight - ((bpm - yMin) / (yMax - yMin)) * innerHeight;
  };

  // Generate SVG path for line chart
  const linePath = data.samples
    .map((sample, i) => {
      const x = xScale(sample.timestamp);
      const y = yScale(sample.bpm);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    })
    .join(' ');

  // Generate area path (for gradient fill)
  const areaPath = data.samples.length > 0
    ? `${linePath} L ${xScale(data.samples[data.samples.length - 1].timestamp)},${padding.top + innerHeight} L ${xScale(data.samples[0].timestamp)},${padding.top + innerHeight} Z`
    : '';

  // Y-axis labels (every 20 bpm)
  const yLabels = [];
  const yStep = 20;
  for (let bpm = Math.ceil(yMin / yStep) * yStep; bpm <= yMax; bpm += yStep) {
    yLabels.push(bpm);
  }

  // X-axis labels (every 3 hours)
  const xLabels = [];
  for (let hour = 0; hour <= 24; hour += 3) {
    const timestamp = dayStart + hour * 3600 * 1000;
    xLabels.push({
      label: `${hour.toString().padStart(2, '0')}:00`,
      x: xScale(timestamp),
    });
  }

  // Heart rate zones (based on estimated max HR or measured max)
  // Use 220 - 35 (age estimate) = 185 as default max HR
  const estimatedMaxHR = 185;
  const hrZones = [
    { name: 'Zone 1 (Rust)', min: 0, max: estimatedMaxHR * 0.6, color: '#d1d5db', opacity: 0.15 }, // Gray
    { name: 'Zone 2 (Vet)', min: estimatedMaxHR * 0.6, max: estimatedMaxHR * 0.7, color: '#60a5fa', opacity: 0.15 }, // Blue
    { name: 'Zone 3 (Cardio)', min: estimatedMaxHR * 0.7, max: estimatedMaxHR * 0.8, color: '#34d399', opacity: 0.15 }, // Green
    { name: 'Zone 4 (Anaërobe)', min: estimatedMaxHR * 0.8, max: estimatedMaxHR * 0.9, color: '#fb923c', opacity: 0.15 }, // Orange
    { name: 'Zone 5 (Max)', min: estimatedMaxHR * 0.9, max: estimatedMaxHR, color: '#f87171', opacity: 0.15 }, // Red
  ];

  // Calculate time spent in each zone
  const zoneStats = hrZones.map(zone => {
    const samplesInZone = data.samples.filter(s => s.bpm >= zone.min && s.bpm < zone.max).length;
    const percentage = (samplesInZone / data.samples.length) * 100;
    return {
      ...zone,
      count: samplesInZone,
      percentage: percentage,
    };
  });

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            💓 Hartslag - {new Date(data.date).toLocaleDateString('nl-NL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {data.sampleCount} metingen • Gem: {data.avgBpm} bpm • Min: {data.minBpm} bpm • Max: {data.maxBpm} bpm
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
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
            <linearGradient id="heartRateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>

          {/* Heart Rate Zones (background) */}
          {hrZones.map((zone, i) => {
            const zoneTop = Math.max(yScale(zone.max), padding.top);
            const zoneBottom = Math.min(yScale(zone.min), chartHeight - padding.bottom);
            const zoneHeight = zoneBottom - zoneTop;

            if (zoneHeight <= 0 || zoneBottom < padding.top || zoneTop > chartHeight - padding.bottom) {
              return null; // Zone not visible in current range
            }

            return (
              <rect
                key={`zone-${i}`}
                x={padding.left}
                y={zoneTop}
                width={innerWidth}
                height={zoneHeight}
                fill={zone.color}
                opacity={zone.opacity}
              />
            );
          })}

          {/* Grid lines (horizontal) */}
          {yLabels.map(bpm => (
            <line
              key={`grid-${bpm}`}
              x1={padding.left}
              y1={yScale(bpm)}
              x2={chartWidth - padding.right}
              y2={yScale(bpm)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#heartRateGradient)"
            />
          )}

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

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
          {yLabels.map(bpm => (
            <text
              key={`y-label-${bpm}`}
              x={padding.left - 10}
              y={yScale(bpm)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-gray-600"
            >
              {bpm}
            </text>
          ))}

          {/* Y-axis label */}
          <text
            x={padding.left - 35}
            y={chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${padding.left - 35}, ${chartHeight / 2})`}
            className="text-sm fill-gray-700 font-medium"
          >
            Hartslag (bpm)
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

        {/* Collapsible Zone Statistics Panel */}
        <div
          className={`absolute top-0 right-0 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-300 ${
            isExpanded ? 'w-56 p-3' : 'w-12 p-2'
          }`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center text-gray-600 hover:text-gray-900 mb-2"
            title={isExpanded ? 'Inklappen' : 'Uitklappen'}
          >
            <span className="text-lg">{isExpanded ? '→' : '←'}</span>
          </button>

          {isExpanded ? (
            /* Expanded: Full details */
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Tijd per Zone</h4>
              <div className="space-y-2">
                {zoneStats.map((zone, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded" style={{ backgroundColor: zone.color, opacity: 1 }}></div>
                        <span className="font-medium text-gray-700 text-[10px]">{zone.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 text-xs">{zone.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: `${zone.percentage}%`,
                          backgroundColor: zone.color,
                          opacity: 0.8
                        }}
                      ></div>
                    </div>
                    <div className="text-[9px] text-gray-500">
                      {Math.round(zone.min)}-{Math.round(zone.max)} bpm
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Collapsed: Only percentages */
            <div className="space-y-1">
              {zoneStats.map((zone, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded mb-0.5" style={{ backgroundColor: zone.color, opacity: 1 }}></div>
                  <span className="text-[9px] font-semibold text-gray-900">{zone.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
