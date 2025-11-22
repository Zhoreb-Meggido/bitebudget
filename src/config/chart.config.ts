/**
 * Shared Chart.js Configuration
 * Centralized chart options, colors, and builders to reduce duplication
 */

import type { ChartOptions } from 'chart.js';

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export const CHART_COLORS = {
  // Nutrition colors
  nutrition: {
    calories: 'rgb(59, 130, 246)',      // blue
    protein: 'rgb(147, 51, 234)',        // purple
    carbohydrates: 'rgb(245, 158, 11)',  // amber
    sugars: 'rgb(251, 191, 36)',         // yellow
    fat: 'rgb(156, 163, 175)',           // gray
    saturatedFat: 'rgb(239, 68, 68)',    // red
    fiber: 'rgb(34, 197, 94)',           // green
    sodium: 'rgb(249, 115, 22)',         // orange
  },

  // Activity colors
  activity: {
    steps: 'rgb(59, 130, 246)',          // blue
    calories: 'rgb(249, 115, 22)',       // orange
    caloriesAlt: 'rgb(239, 68, 68)',     // red (for when calories conflicts)
    activeCalories: 'rgb(239, 68, 68)',  // red
    totalCalories: 'rgb(220, 38, 38)',   // dark red
    intensityMinutes: 'rgb(147, 51, 234)', // purple
    heartRate: 'rgb(14, 165, 233)',      // sky blue
    heartRateMax: 'rgb(220, 38, 38)',    // dark red
    sleep: 'rgb(34, 197, 94)',           // green
    bodyBattery: 'rgb(59, 130, 246)',    // blue
    stress: 'rgb(245, 158, 11)',         // amber
    hrv: 'rgb(14, 165, 233)',            // sky blue
  },

  // Balance/weight colors
  balance: {
    intake: 'rgb(59, 130, 246)',         // blue
    expenditure: 'rgb(249, 115, 22)',    // orange
    weight: 'rgb(59, 130, 246)',         // blue
    trend: 'rgba(239, 68, 68, 0.5)',     // red transparent
  },
} as const;

// ============================================================================
// COMMON PLUGIN CONFIGURATIONS
// ============================================================================

export const commonPlugins = {
  legend: {
    position: 'bottom' as const,
    labels: {
      usePointStyle: true,
      padding: 15,
    },
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    titleColor: '#fff',
    bodyColor: '#fff',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
};

// ============================================================================
// BASE CHART OPTIONS
// ============================================================================

export const baseChartOptions: Partial<ChartOptions<'line'>> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: commonPlugins,
};

// ============================================================================
// SCALE BUILDERS
// ============================================================================

interface YAxisConfig {
  display?: boolean;
  position?: 'left' | 'right';
  title?: string;
  color?: string;
  beginAtZero?: boolean;
  drawOnChartArea?: boolean;
  fontSize?: number;
  maxTicksLimit?: number;
}

export function createYAxis(config: YAxisConfig) {
  const {
    display = true,
    position = 'left',
    title,
    color,
    beginAtZero = true,
    drawOnChartArea = true,
    fontSize = 12,
    maxTicksLimit,
  } = config;

  return {
    type: 'linear' as const,
    display,
    position,
    beginAtZero,
    ...(title && {
      title: {
        display: true,
        text: title,
        ...(color && { color }),
        font: { size: fontSize },
      },
    }),
    ...(color && {
      ticks: {
        color,
        font: { size: fontSize - 1 },
        ...(maxTicksLimit && { maxTicksLimit }),
      },
      grid: {
        color: `${color.replace('rgb', 'rgba').replace(')', ', 0.1)')}`,
        ...(drawOnChartArea !== undefined && { drawOnChartArea }),
      },
    }),
    ...(!color && {
      ticks: {
        font: { size: fontSize - 1 },
        ...(maxTicksLimit && { maxTicksLimit }),
      },
      ...(!drawOnChartArea && { grid: { drawOnChartArea: false } }),
    }),
  };
}

export function createXAxis(config: { hideGrid?: boolean; fontSize?: number } = {}) {
  const { hideGrid = true, fontSize = 11 } = config;

  return {
    ...(hideGrid && { grid: { display: false } }),
    ticks: {
      font: { size: fontSize },
    },
  };
}

// ============================================================================
// DATASET BUILDERS
// ============================================================================

interface LineDatasetConfig {
  label: string;
  data: number[];
  color: string;
  yAxisID?: string;
  tension?: number;
  borderWidth?: number;
  fill?: boolean;
  pointRadius?: number;
  pointHoverRadius?: number;
  borderDash?: number[];
}

export function createLineDataset(config: LineDatasetConfig) {
  const {
    label,
    data,
    color,
    yAxisID,
    tension = 0.3,
    borderWidth = 2,
    fill = false,
    pointRadius = 5,
    pointHoverRadius = 7,
    borderDash,
  } = config;

  return {
    label,
    data,
    borderColor: color,
    backgroundColor: fill ? `${color.replace('rgb', 'rgba').replace(')', ', 0.1)')}` : 'transparent',
    tension,
    borderWidth,
    fill,
    pointRadius,
    pointHoverRadius,
    ...(yAxisID && { yAxisID }),
    ...(borderDash && { borderDash }),
  };
}

// ============================================================================
// RESPONSIVE HELPERS
// ============================================================================

export function getResponsiveConfig() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isVerySmall = typeof window !== 'undefined' && window.innerWidth < 640;

  return {
    isMobile,
    isVerySmall,
    fontSize: isMobile ? 10 : 12,
    tickFontSize: isMobile ? 9 : 11,
    maxTicksLimit: isMobile ? 4 : 6,
  };
}

// ============================================================================
// CHART OPTION BUILDERS
// ============================================================================

interface ChartOptionsConfig {
  scales?: Record<string, any>;
  plugins?: Partial<typeof commonPlugins>;
}

export function buildChartOptions(config: ChartOptionsConfig = {}): any {
  const { scales = {}, plugins = {} } = config;

  return {
    ...baseChartOptions,
    plugins: {
      ...commonPlugins,
      ...plugins,
    },
    scales: {
      x: createXAxis(),
      ...scales,
    },
  };
}

// ============================================================================
// COMMON SCALE CONFIGURATIONS
// ============================================================================

export const commonScales = {
  // Nutrition scales
  nutrition: {
    grams: () => createYAxis({
      position: 'left',
      title: 'Grammen (g)',
      beginAtZero: true,
    }),
    calories: () => createYAxis({
      position: 'right',
      title: 'Calorieën (kcal)',
      color: CHART_COLORS.nutrition.calories,
      beginAtZero: true,
      drawOnChartArea: false,
    }),
    sodium: () => createYAxis({
      position: 'right',
      title: 'Natrium (mg)',
      color: CHART_COLORS.nutrition.sodium,
      beginAtZero: true,
      drawOnChartArea: false,
    }),
  },

  // Activity scales
  activity: {
    steps: () => createYAxis({
      position: 'left',
      title: 'Stappen',
      color: CHART_COLORS.activity.steps,
      beginAtZero: true,
    }),
    calories: () => createYAxis({
      position: 'right',
      title: 'Calorieën',
      color: CHART_COLORS.activity.calories,
      beginAtZero: true,
      drawOnChartArea: false,
    }),
    heartRate: () => createYAxis({
      position: 'right',
      title: 'Hartslag (bpm)',
      color: CHART_COLORS.activity.heartRate,
      beginAtZero: false,
      drawOnChartArea: false,
    }),
    minutes: () => createYAxis({
      position: 'right',
      title: 'Minuten',
      color: CHART_COLORS.activity.intensityMinutes,
      beginAtZero: true,
      drawOnChartArea: false,
    }),
    sleep: () => createYAxis({
      position: 'right',
      title: 'Slaap (uur)',
      color: CHART_COLORS.activity.sleep,
      beginAtZero: true,
      drawOnChartArea: false,
    }),
    stress: () => createYAxis({
      position: 'right',
      title: 'Stress',
      color: CHART_COLORS.activity.stress,
      beginAtZero: true,
      drawOnChartArea: false,
    }),
    hrv: () => createYAxis({
      position: 'right',
      title: 'HRV (ms)',
      color: CHART_COLORS.activity.hrv,
      beginAtZero: true,
      drawOnChartArea: false,
    }),
  },

  // Weight scale
  weight: () => createYAxis({
    position: 'left',
    title: 'Gewicht (kg)',
    beginAtZero: false,
  }),
};
