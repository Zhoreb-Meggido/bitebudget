/**
 * Report generation utilities
 *
 * Functions for generating TXT and PDF reports from journal entries
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadTextFile } from './download.utils';
import { NUTRITION_CONSTANTS } from '@/config/nutrition.constants';
import { DEFAULT_SETTINGS } from '@/types/database.types';
import type { Entry } from '@/types';

interface DayData {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
}

interface DayGroup {
  [date: string]: Entry[];
}

export interface ReportOptions {
  days?: number;
  startDate?: string;
  endDate?: string;
  months?: string[]; // Array of month strings in format "YYYY-MM" for monthly reports
}

/**
 * Filter entries based on report options
 */
function filterEntriesByDateRange(entries: Entry[], options: ReportOptions): Entry[] {
  if (options.startDate && options.endDate) {
    // Custom date range
    return entries.filter(e => e.date >= options.startDate! && e.date <= options.endDate!);
  } else if (options.days !== undefined && options.days > 0) {
    // Last N days
    const dateGroups: DayGroup = {};
    entries.forEach(entry => {
      if (!dateGroups[entry.date]) {
        dateGroups[entry.date] = [];
      }
      dateGroups[entry.date].push(entry);
    });

    const relevantDates = Object.keys(dateGroups)
      .sort()
      .reverse()
      .slice(0, options.days);

    return entries.filter(e => relevantDates.includes(e.date));
  } else {
    // All data (days === 0 or undefined)
    return entries;
  }
}

/**
 * Aggregate entries by date and calculate daily totals
 */
function aggregateDailyData(entries: Entry[], options: ReportOptions): DayData[] {
  const filteredEntries = filterEntriesByDateRange(entries, options);
  const dateGroups: DayGroup = {};

  filteredEntries.forEach(entry => {
    if (!dateGroups[entry.date]) {
      dateGroups[entry.date] = [];
    }
    dateGroups[entry.date].push(entry);
  });

  const dailyTotals = Object.keys(dateGroups)
    .map(date => {
      const dayEntries = dateGroups[date];
      const totals = dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + (e.calories || 0),
          protein: acc.protein + (e.protein || 0),
          fat: acc.fat + (e.fat || 0),
          saturatedFat: acc.saturatedFat + (e.saturatedFat || 0),
          fiber: acc.fiber + (e.fiber || 0),
          sodium: acc.sodium + (e.sodium || 0),
        }),
        { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
      );

      return {
        date,
        ...totals,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return dailyTotals;
}

/**
 * Generate TXT report
 */
export function generateTxtReport(entries: Entry[], options: ReportOptions = { days: 14 }): void {
  const filteredEntries = filterEntriesByDateRange(entries, options);
  const dateGroups: DayGroup = {};

  filteredEntries.forEach(entry => {
    if (!dateGroups[entry.date]) {
      dateGroups[entry.date] = [];
    }
    dateGroups[entry.date].push(entry);
  });

  const relevantDates = Object.keys(dateGroups)
    .sort()
    .reverse();

  // Generate report title based on options
  let reportTitle = 'VOEDSELJOURNAAL RAPPORT';
  if (options.startDate && options.endDate) {
    reportTitle += ` - ${options.startDate} t/m ${options.endDate}`;
  } else if (options.days) {
    reportTitle += ` - LAATSTE ${options.days} DAGEN`;
  } else {
    reportTitle += ' - ALLE DATA';
  }

  let report = `${reportTitle}\n`;
  report += '='.repeat(60) + '\n\n';

  relevantDates.forEach(date => {
    const dayEntries = dateGroups[date].sort((a, b) => a.time.localeCompare(b.time));
    const dayTotals = dayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + (e.calories || 0),
        protein: acc.protein + (e.protein || 0),
        fat: acc.fat + (e.fat || 0),
        saturatedFat: acc.saturatedFat + (e.saturatedFat || 0),
        fiber: acc.fiber + (e.fiber || 0),
        sodium: acc.sodium + (e.sodium || 0),
      }),
      { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
    );

    report += `📅 ${date}\n`;
    report += '-'.repeat(60) + '\n';
    dayEntries.forEach(entry => {
      report += `${entry.time} - ${entry.name}\n`;
      report += `  Kcal: ${entry.calories || 0}, Eiwit: ${(entry.protein || 0).toFixed(1)}g, Vet: ${(entry.fat || 0).toFixed(1)}g, `;
      report += `Verz.vet: ${(entry.saturatedFat || 0).toFixed(1)}g, Vezels: ${(entry.fiber || 0).toFixed(1)}g, Natrium: ${entry.sodium || 0}mg\n`;
    });
    report += `\nDag totaal:\n`;
    report += `  Calorieën: ${dayTotals.calories} kcal\n`;
    report += `  Eiwit: ${dayTotals.protein.toFixed(1)}g\n`;
    report += `  Vet: ${dayTotals.fat.toFixed(1)}g\n`;
    report += `  Verzadigd vet: ${dayTotals.saturatedFat.toFixed(1)}g\n`;
    report += `  Vezels: ${dayTotals.fiber.toFixed(1)}g\n`;
    report += `  Natrium: ${dayTotals.sodium}mg\n`;
    report += '\n\n';
  });

  // Add averages
  const data = aggregateDailyData(entries, options);
  if (data.length > 0) {
    const avg = {
      calories: Math.round(data.reduce((sum, d) => sum + d.calories, 0) / data.length),
      protein: (data.reduce((sum, d) => sum + d.protein, 0) / data.length).toFixed(1),
      fat: (data.reduce((sum, d) => sum + d.fat, 0) / data.length).toFixed(1),
      saturatedFat: (data.reduce((sum, d) => sum + d.saturatedFat, 0) / data.length).toFixed(1),
      fiber: (data.reduce((sum, d) => sum + d.fiber, 0) / data.length).toFixed(1),
      sodium: Math.round(data.reduce((sum, d) => sum + d.sodium, 0) / data.length),
    };

    report += '='.repeat(60) + '\n';
    report += 'GEMIDDELDEN OVER DEZE PERIODE\n';
    report += '='.repeat(60) + '\n';
    report += `Calorieën:     ${avg.calories} kcal\n`;
    report += `Eiwit:         ${avg.protein}g\n`;
    report += `Vet:           ${avg.fat}g\n`;
    report += `Verzadigd vet: ${avg.saturatedFat}g\n`;
    report += `Vezels:        ${avg.fiber}g\n`;
    report += `Natrium:       ${avg.sodium}mg\n`;
  }

  const filename = `voedseljournaal_${new Date().toISOString().split('T')[0]}.txt`;
  downloadTextFile(report, filename);
}

/**
 * Get gradient color based on metric value and type
 */
function getGradientColor(value: number, type: string): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;

  switch (type) {
    case 'calories': {
      const calGoal = DEFAULT_SETTINGS.caloriesRest;
      const percentage = Math.min(value / calGoal, 1.5);
      if (percentage <= 0.95) {
        r = 34;
        g = 197;
        b = 94;
      } else if (percentage <= 1.05) {
        const t = (percentage - 0.95) / 0.1;
        r = Math.round(34 + (234 - 34) * t);
        g = Math.round(197 + (179 - 197) * t);
        b = Math.round(94 + (8 - 94) * t);
      } else {
        const t = Math.min((percentage - 1.05) / 0.2, 1);
        r = Math.round(234 + (239 - 234) * t);
        g = Math.round(179 - 179 * t);
        b = 8;
      }
      break;
    }

    case 'protein': {
      if (value <= 35) {
        const t = value / 35;
        r = 239;
        g = Math.round(68 + (179 - 68) * t);
        b = Math.round(68 + (8 - 68) * t);
      } else if (value <= 71) {
        const t = (value - 35) / 36;
        r = Math.round(234 - (234 - 134) * t);
        g = Math.round(179 + (239 - 179) * t);
        b = Math.round(8 + (172 - 8) * t);
      } else {
        const t = Math.min((value - 71) / 49, 1);
        r = Math.round(134 - (134 - 34) * t);
        g = Math.round(239 - (239 - 197) * t);
        b = Math.round(172 - (172 - 94) * t);
      }
      break;
    }

    case 'fiber': {
      if (value <= 17.5) {
        const t = value / 17.5;
        r = Math.round(239 + (234 - 239) * t);
        g = Math.round(68 + (179 - 68) * t);
        b = Math.round(68 + (8 - 68) * t);
      } else {
        const t = Math.min((value - 17.5) / 17.5, 1);
        r = Math.round(234 - (234 - 34) * t);
        g = Math.round(179 + (197 - 179) * t);
        b = Math.round(8 + (94 - 8) * t);
      }
      break;
    }

    case 'saturatedFat': {
      if (value <= 10) {
        r = 34;
        g = 197;
        b = 94;
      } else if (value <= 20) {
        const t = (value - 10) / 10;
        r = Math.round(34 + (234 - 34) * t);
        g = Math.round(197 + (179 - 197) * t);
        b = Math.round(94 + (8 - 94) * t);
      } else {
        const t = Math.min((value - 20) / 10, 1);
        r = Math.round(234 + (239 - 234) * t);
        g = Math.round(179 - 179 * t);
        b = 8;
      }
      break;
    }

    case 'sodium': {
      if (value <= 1150) {
        r = 34;
        g = 197;
        b = 94;
      } else if (value <= 2300) {
        const t = (value - 1150) / 1150;
        r = Math.round(34 + (234 - 34) * t);
        g = Math.round(197 + (179 - 197) * t);
        b = Math.round(94 + (8 - 94) * t);
      } else {
        const t = Math.min((value - 2300) / 700, 1);
        r = Math.round(234 + (239 - 234) * t);
        g = Math.round(179 - 179 * t);
        b = 8;
      }
      break;
    }

    default:
      r = 200;
      g = 200;
      b = 200;
  }

  return { r, g, b };
}

/**
 * Detect if we should generate a monthly report
 */
function shouldGenerateMonthlyReport(options: ReportOptions): boolean {
  // If months array is provided, it's always a monthly report
  if (options.months && options.months.length > 0) {
    return true;
  }

  // Check if it's a complete single month (startDate and endDate form a full month)
  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);

    // Check if it starts on the 1st of a month
    const isFirstDay = start.getDate() === 1;

    // Check if it ends on the last day of the month
    const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    const isLastDay = end.getDate() === lastDayOfMonth;

    // Check if both dates are in the same month
    const isSameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

    return isFirstDay && isLastDay && isSameMonth;
  }

  return false;
}

/**
 * Generate PDF report (delegates to appropriate format)
 */
export function generatePdfReport(entries: Entry[], options: ReportOptions = { days: 14 }): void {
  if (shouldGenerateMonthlyReport(options)) {
    generateMonthlyPdfReport(entries, options);
  } else {
    generateStandardPdfReport(entries, options);
  }
}

/**
 * Generate standard weekly PDF report (original format)
 */
function generateStandardPdfReport(entries: Entry[], options: ReportOptions): void {
  const doc = new jsPDF();
  const filteredEntries = filterEntriesByDateRange(entries, options);

  // Helper function to format date
  function formatDateForPDF(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }

  // Group entries by date
  const dateGroups: DayGroup = {};
  filteredEntries.forEach(entry => {
    if (!dateGroups[entry.date]) {
      dateGroups[entry.date] = [];
    }
    dateGroups[entry.date].push(entry);
  });

  // Get relevant dates (already filtered by filterEntriesByDateRange)
  const relevantDates = Object.keys(dateGroups)
    .sort()
    .reverse();

  if (relevantDates.length === 0) {
    alert('Geen data beschikbaar voor rapport');
    return;
  }

  relevantDates.reverse();

  // Group dates into weeks
  const weeks: string[][] = [];
  let currentWeek: string[] = [];
  relevantDates.forEach((date, index) => {
    currentWeek.push(date);
    if (currentWeek.length === 7 || index === relevantDates.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text('Voedseljournaal Rapport', 15, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Periode: ${formatDateForPDF(relevantDates[0])} tot ${formatDateForPDF(relevantDates[relevantDates.length - 1])}`,
    15,
    yPos
  );
  doc.text(`Gegenereerd: ${new Date().toLocaleDateString('nl-NL')}`, 15, yPos + 5);
  yPos += 15;

  // Process each week
  for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
    const weekDates = weeks[weekIndex];

    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // Week Header
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text(
      `Week ${weekIndex + 1}: ${formatDateForPDF(weekDates[0])} tot ${formatDateForPDF(weekDates[weekDates.length - 1])}`,
      15,
      yPos
    );
    yPos += 8;

    // Calculate week averages (all 8 metrics)
    const weekTotals = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      sugars: 0,
      fat: 0,
      saturatedFat: 0,
      fiber: 0,
      sodium: 0
    };
    let dayCount = 0;

    weekDates.forEach(date => {
      if (dateGroups[date]) {
        dayCount++;
        const dayEntries = dateGroups[date];
        const dayTotal = dayEntries.reduce(
          (acc, e) => ({
            calories: acc.calories + (e.calories || 0),
            protein: acc.protein + (e.protein || 0),
            carbohydrates: acc.carbohydrates + (e.carbohydrates || 0),
            sugars: acc.sugars + (e.sugars || 0),
            fat: acc.fat + (e.fat || 0),
            saturatedFat: acc.saturatedFat + (e.saturatedFat || 0),
            fiber: acc.fiber + (e.fiber || 0),
            sodium: acc.sodium + (e.sodium || 0),
          }),
          { calories: 0, protein: 0, carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
        );

        weekTotals.calories += dayTotal.calories;
        weekTotals.protein += dayTotal.protein;
        weekTotals.carbohydrates += dayTotal.carbohydrates;
        weekTotals.sugars += dayTotal.sugars;
        weekTotals.fat += dayTotal.fat;
        weekTotals.saturatedFat += dayTotal.saturatedFat;
        weekTotals.fiber += dayTotal.fiber;
        weekTotals.sodium += dayTotal.sodium;
      }
    });

    const weekAvg = {
      calories: Math.round(weekTotals.calories / dayCount),
      protein: parseFloat((weekTotals.protein / dayCount).toFixed(1)),
      carbohydrates: parseFloat((weekTotals.carbohydrates / dayCount).toFixed(1)),
      sugars: parseFloat((weekTotals.sugars / dayCount).toFixed(1)),
      fat: parseFloat((weekTotals.fat / dayCount).toFixed(1)),
      saturatedFat: parseFloat((weekTotals.saturatedFat / dayCount).toFixed(1)),
      fiber: parseFloat((weekTotals.fiber / dayCount).toFixed(1)),
      sodium: Math.round(weekTotals.sodium / dayCount),
    };

    // Gradient Cards (6 metrics in 1 row)
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text('Weekgemiddelden:', 15, yPos);
    yPos += 7;

    const cardWidth = 28; // Smaller to fit 6 cards in a row
    const cardHeight = 16;
    const cardSpacing = 2;
    const marginLeft = 15;

    // Single row: 6 cards (removed Vet and Koolhydraten)
    let cardX = marginLeft;
    const metricsRow = [
      { key: 'calories', label: 'Cal', value: weekAvg.calories, unit: 'kcal' },
      { key: 'protein', label: 'Eiw', value: weekAvg.protein, unit: 'g' },
      { key: 'sugars', label: 'Suik', value: weekAvg.sugars, unit: 'g' },
      { key: 'saturatedFat', label: 'V.vet', value: weekAvg.saturatedFat, unit: 'g' },
      { key: 'fiber', label: 'Vezels', value: weekAvg.fiber, unit: 'g' },
      { key: 'sodium', label: 'Natrium', value: weekAvg.sodium, unit: 'mg' },
    ];

    metricsRow.forEach(metric => {
      const color = getGradientColor(metric.value, metric.key);

      doc.setFillColor(color.r, color.g, color.b);
      doc.roundedRect(cardX, yPos, cardWidth, cardHeight, 2, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(metric.label, cardX + 2, yPos + 4);

      doc.setFontSize(14); // Larger font for values
      doc.setFont(undefined, 'bold');
      const valueText = `${metric.value}${metric.unit}`;
      doc.text(valueText, cardX + 2, yPos + 11);
      doc.setFont(undefined, 'normal');

      cardX += cardWidth + cardSpacing;
    });

    yPos += cardHeight + 10;

    // Prepare graph data for all days in the week (only if we have at least 2 days)
    const graphData = weekDates.map(date => {
      const dayEntries = dateGroups[date] || [];
      const dayTotal = dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + (e.calories || 0),
          protein: acc.protein + (e.protein || 0),
          carbohydrates: acc.carbohydrates + (e.carbohydrates || 0),
          sugars: acc.sugars + (e.sugars || 0),
          fat: acc.fat + (e.fat || 0),
          saturatedFat: acc.saturatedFat + (e.saturatedFat || 0),
          fiber: acc.fiber + (e.fiber || 0),
          sodium: acc.sodium + (e.sodium || 0),
        }),
        { calories: 0, protein: 0, carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
      );
      return { date, ...dayTotal };
    });

    // 2x2 Line graphs (only if we have at least 2 data points)
    if (graphData.length > 1) {
      const graphHeight = 35;
      const graphWidth = 85; // Adjusted to fit 2 graphs within margins
      const graphSpacing = 10;
      const graphPaddingBottom = 8;

      // Define 4 graph pairs
      const graphPairs = [
        {
          title: 'Koolhydraten & Suikers',
          metrics: [
            { key: 'carbohydrates', color: [245, 158, 11], label: 'Koolh', unit: 'g', max: 300 },
            { key: 'sugars', color: [249, 115, 22], label: 'Suik', unit: 'g', max: 100 },
          ]
        },
        {
          title: 'Vet & Verzadigd vet',
          metrics: [
            { key: 'fat', color: [234, 179, 8], label: 'Vet', unit: 'g', max: 100 },
            { key: 'saturatedFat', color: [239, 68, 68], label: 'V.vet', unit: 'g', max: 30 },
          ]
        },
        {
          title: 'Vezels & Eiwit',
          metrics: [
            { key: 'fiber', color: [34, 197, 94], label: 'Vezels', unit: 'g', max: 50 },
            { key: 'protein', color: [147, 51, 234], label: 'Eiwit', unit: 'g', max: 120 },
          ]
        },
        {
          title: 'Calorieën & Natrium',
          metrics: [
            { key: 'calories', color: [59, 130, 246], label: 'Cal', unit: 'kcal', max: 2500 },
            { key: 'sodium', color: [156, 163, 175], label: 'Na', unit: 'mg', max: 3000 },
          ]
        },
      ];

      const pointSpacing = graphData.length > 1 ? graphWidth / (graphData.length - 1) : 0;

      // Draw 2x2 grid
      graphPairs.forEach((pair, pairIndex) => {
        const row = Math.floor(pairIndex / 2);
        const col = pairIndex % 2;
        const graphX = marginLeft + col * (graphWidth + graphSpacing);
        const graphY = yPos + row * (graphHeight + graphPaddingBottom + 10);

        // Title
        doc.setFontSize(8);
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'bold');
        doc.text(pair.title, graphX, graphY - 2);
        doc.setFont('helvetica', 'normal');

        // Background
        doc.setFillColor(250, 250, 250);
        doc.rect(graphX, graphY, graphWidth, graphHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(graphX, graphY, graphWidth, graphHeight, 'S');

        // Grid lines
        doc.setDrawColor(230, 230, 230);
        for (let i = 1; i <= 4; i++) {
          const gridY = graphY + (graphHeight / 5) * i;
          doc.line(graphX, gridY, graphX + graphWidth, gridY);
        }

        // Find max value for this graph
        const maxVal = Math.max(...pair.metrics.map(m =>
          Math.max(...graphData.map(d => (d as any)[m.key] || 0))
        ));
        const yAxisMax = Math.max(maxVal * 1.1, pair.metrics[0].max * 0.3); // At least 30% of max scale

        // Y-axis labels (left side - absolute values)
        doc.setFontSize(5);
        doc.setTextColor(100, 100, 100);
        for (let i = 0; i <= 5; i++) {
          const value = Math.round((yAxisMax / 5) * (5 - i));
          const labelY = graphY + (graphHeight / 5) * i + 1.5;
          doc.text(value.toString(), graphX - 2, labelY, { align: 'right' });
        }

        // Draw lines for each metric
        pair.metrics.forEach(metric => {
          doc.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
          doc.setLineWidth(0.5);

          for (let i = 0; i < graphData.length - 1; i++) {
            const x1 = graphX + pointSpacing * i;
            const x2 = graphX + pointSpacing * (i + 1);

            const value1 = (graphData[i] as any)[metric.key] || 0;
            const value2 = (graphData[i + 1] as any)[metric.key] || 0;

            const y1 = graphY + graphHeight - (value1 / yAxisMax) * graphHeight;
            const y2 = graphY + graphHeight - (value2 / yAxisMax) * graphHeight;

            if (isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)) {
              doc.line(x1, y1, x2, y2);
            }
          }
        });

        // X-axis labels (day names)
        doc.setFontSize(5);
        doc.setTextColor(100, 100, 100);
        graphData.forEach((data, i) => {
          const date = new Date(data.date);
          const dayName = date.toLocaleDateString('nl-NL', { weekday: 'short' }).substring(0, 2);
          const labelX = graphX + pointSpacing * i;
          const labelY = graphY + graphHeight + 3;
          if (isFinite(labelX) && isFinite(labelY)) {
            doc.text(dayName, labelX, labelY, { align: 'center' });
          }
        });

        // Legend
        const legendX = graphX + 2;
        let legendY = graphY + 4;
        doc.setFontSize(5);
        pair.metrics.forEach(metric => {
          doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
          doc.rect(legendX, legendY - 1, 2, 1.5, 'F');
          doc.setTextColor(0, 0, 0);
          doc.text(`${metric.label} (${metric.unit})`, legendX + 3, legendY);
          legendY += 3;
        });
      });

      yPos += 2 * (graphHeight + graphPaddingBottom + 10) + 5;

      // Reset styles
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setLineWidth(0.1);
      doc.setDrawColor(0, 0, 0);
    } // End of graph drawing if statement

    yPos += 5;

    // Week overview table
    const weekTableRows = weekDates.map(date => {
      const dayEntries = dateGroups[date] || [];
      const dayTotal = dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + (e.calories || 0),
          protein: acc.protein + (e.protein || 0),
          sugars: acc.sugars + (e.sugars || 0),
          saturatedFat: acc.saturatedFat + (e.saturatedFat || 0),
          fiber: acc.fiber + (e.fiber || 0),
          sodium: acc.sodium + (e.sodium || 0),
        }),
        { calories: 0, protein: 0, sugars: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
      );

      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('nl-NL', { weekday: 'short' });

      return [
        dayName,
        formatDateForPDF(date),
        dayTotal.calories || '-',
        dayTotal.protein ? dayTotal.protein.toFixed(1) : '-',
        dayTotal.sugars ? dayTotal.sugars.toFixed(1) : '-',
        dayTotal.saturatedFat ? dayTotal.saturatedFat.toFixed(1) : '-',
        dayTotal.fiber ? dayTotal.fiber.toFixed(1) : '-',
        dayTotal.sodium || '-',
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Dag', 'Datum', 'Cal', 'Eiw (g)', 'Suik (g)', 'V.vet (g)', 'Vez (g)', 'Na (mg)']],
      body: weekTableRows,
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
      },
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;
  }

  // Page break before meals appendix
  doc.addPage();
  yPos = 20;

  // Meals Appendix Title
  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.text('Bijlage: Dagelijkse Maaltijden', 15, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 10;

  // Daily details table (now as appendix)
  relevantDates.forEach(date => {
    const dayEntries = dateGroups[date];
    if (!dayEntries) return;

    // Check page space
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDateForPDF(date), 15, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 6;

    const mealRows = dayEntries
      .sort((a, b) => a.time.localeCompare(b.time))
      .map(entry => [
        entry.time,
        entry.name,
        entry.calories,
        (entry.protein || 0).toFixed(1),
        (entry.carbohydrates || 0).toFixed(1),
        (entry.sugars || 0).toFixed(1),
        (entry.fat || 0).toFixed(1),
        (entry.saturatedFat || 0).toFixed(1),
        (entry.fiber || 0).toFixed(1),
        entry.sodium || 0,
      ]);

    const dayTotal = dayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + (e.calories || 0),
        protein: acc.protein + (e.protein || 0),
        carbohydrates: acc.carbohydrates + (e.carbohydrates || 0),
        sugars: acc.sugars + (e.sugars || 0),
        fat: acc.fat + (e.fat || 0),
        saturatedFat: acc.saturatedFat + (e.saturatedFat || 0),
        fiber: acc.fiber + (e.fiber || 0),
        sodium: acc.sodium + (e.sodium || 0),
      }),
      { calories: 0, protein: 0, carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
    );

    mealRows.push([
      '',
      'TOTAAL',
      dayTotal.calories,
      dayTotal.protein.toFixed(1),
      dayTotal.carbohydrates.toFixed(1),
      dayTotal.sugars.toFixed(1),
      dayTotal.fat.toFixed(1),
      dayTotal.saturatedFat.toFixed(1),
      dayTotal.fiber.toFixed(1),
      dayTotal.sodium,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Tijd', 'Maaltijd', 'Cal', 'Eiw', 'Kh', 'Suik', 'Vet', 'V.vet', 'Vez', 'Na']],
      body: mealRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 65 },
        2: { cellWidth: 13, halign: 'right' },
        3: { cellWidth: 11, halign: 'right' },
        4: { cellWidth: 11, halign: 'right' },
        5: { cellWidth: 11, halign: 'right' },
        6: { cellWidth: 11, halign: 'right' },
        7: { cellWidth: 11, halign: 'right' },
        8: { cellWidth: 11, halign: 'right' },
        9: { cellWidth: 13, halign: 'right' },
      },
      margin: { left: 15, right: 15 },
      didDrawPage: function (data) {
        yPos = data.cursor?.y || yPos;
      },
    });

    yPos += 5;
  });


  // Page numbers
  const pageHeight = doc.internal.pageSize.height;
  for (let i = 1; i <= doc.internal.getNumberOfPages(); i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Pagina ${i} van ${doc.internal.getNumberOfPages()}`, 105, pageHeight - 10, { align: 'center' });
  }

  // Save PDF
  const fileName = `voedseljournaal_rapport_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Generate monthly PDF report (new format for full months)
 */
function generateMonthlyPdfReport(entries: Entry[], options: ReportOptions): void {
  const doc = new jsPDF();

  // Helper function to format date
  function formatDateForPDF(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }

  // Determine which months to process
  let monthsToProcess: string[] = [];

  if (options.months && options.months.length > 0) {
    // Use provided months array
    monthsToProcess = [...options.months].sort();
  } else if (options.startDate && options.endDate) {
    // Extract month from start date (should be a full month based on shouldGenerateMonthlyReport)
    const start = new Date(options.startDate);
    const monthStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    monthsToProcess = [monthStr];
  }

  if (monthsToProcess.length === 0) {
    alert('Geen maanden geselecteerd voor maandrapportage');
    return;
  }

  let isFirstMonth = true;

  // Process each month
  monthsToProcess.forEach(monthStr => {
    const [year, month] = monthStr.split('-');
    const monthStart = `${year}-${month}-01`;
    const monthEnd = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    // Filter entries for this month
    const monthEntries = entries.filter(e => e.date >= monthStart && e.date <= monthEnd);

    if (monthEntries.length === 0) {
      return; // Skip months with no data
    }

    // Add page break if not first month
    if (!isFirstMonth) {
      doc.addPage();
    }
    isFirstMonth = false;

    let yPos = 20;
    const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = monthDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

    // Title
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55);
    doc.text(`Maandrapportage ${monthName}`, 15, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Gegenereerd: ${new Date().toLocaleDateString('nl-NL')}`, 15, yPos);
    yPos += 15;

    // Group entries by date
    const dateGroups: DayGroup = {};
    monthEntries.forEach(entry => {
      if (!dateGroups[entry.date]) {
        dateGroups[entry.date] = [];
      }
      dateGroups[entry.date].push(entry);
    });

    const relevantDates = Object.keys(dateGroups).sort();

    // Calculate month averages
    const monthTotals = { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 };
    let dayCount = 0;

    relevantDates.forEach(date => {
      dayCount++;
      const dayEntries = dateGroups[date];
      const dayTotal = dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + (e.calories || 0),
          protein: acc.protein + (e.protein || 0),
          fat: acc.fat + (e.fat || 0),
          saturatedFat: acc.saturatedFat + (e.saturatedFat || 0),
          fiber: acc.fiber + (e.fiber || 0),
          sodium: acc.sodium + (e.sodium || 0),
        }),
        { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
      );

      monthTotals.calories += dayTotal.calories;
      monthTotals.protein += dayTotal.protein;
      monthTotals.fat += dayTotal.fat;
      monthTotals.saturatedFat += dayTotal.saturatedFat;
      monthTotals.fiber += dayTotal.fiber;
      monthTotals.sodium += dayTotal.sodium;
    });

    const monthAvg = {
      calories: Math.round(monthTotals.calories / dayCount),
      protein: parseFloat((monthTotals.protein / dayCount).toFixed(1)),
      fat: parseFloat((monthTotals.fat / dayCount).toFixed(1)),
      saturatedFat: parseFloat((monthTotals.saturatedFat / dayCount).toFixed(1)),
      fiber: parseFloat((monthTotals.fiber / dayCount).toFixed(1)),
      sodium: Math.round(monthTotals.sodium / dayCount),
    };

    // Month overview cards
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text('Maandgemiddelden:', 15, yPos);
    yPos += 7;

    const cardWidth = 35;
    const cardHeight = 16;
    const cardSpacing = 3;
    let cardX = 15;

    const metrics = [
      { key: 'calories', label: 'Calorieën', value: monthAvg.calories, unit: 'kcal', target: `<${DEFAULT_SETTINGS.caloriesRest}` },
      { key: 'protein', label: 'Eiwit', value: monthAvg.protein, unit: 'g', target: '110-120' },
      { key: 'fiber', label: 'Vezels', value: monthAvg.fiber, unit: 'g', target: `>=${NUTRITION_CONSTANTS.FIBER_SUFFICIENT}` },
      { key: 'saturatedFat', label: 'Verz. vet', value: monthAvg.saturatedFat, unit: 'g', target: '<20' },
      { key: 'sodium', label: 'Natrium', value: monthAvg.sodium, unit: 'mg', target: '<2300' },
    ];

    metrics.forEach(metric => {
      const color = getGradientColor(metric.value, metric.key);

      doc.setFillColor(color.r, color.g, color.b);
      doc.roundedRect(cardX, yPos, cardWidth, cardHeight, 2, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(metric.label, cardX + 2, yPos + 4);

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${metric.value}${metric.unit}`, cardX + 2, yPos + 10);
      doc.setFont(undefined, 'normal');

      doc.setFontSize(6);
      doc.text(metric.target, cardX + 2, yPos + 14);

      cardX += cardWidth + cardSpacing;
    });

    yPos += cardHeight + 10;

    // Week overviews (without meal details in tables, just cards)
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.setFont(undefined, 'bold');
    doc.text('Weekoverzichten', 15, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;

    // Group dates into weeks
    const weeks: string[][] = [];
    let currentWeek: string[] = [];
    relevantDates.forEach((date, index) => {
      currentWeek.push(date);
      if (currentWeek.length === 7 || index === relevantDates.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // Process each week
    weeks.forEach((weekDates, weekIndex) => {
      // Check if we need a new page
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      // Week Header
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.setFont(undefined, 'bold');
      doc.text(
        `Week ${weekIndex + 1}: ${formatDateForPDF(weekDates[0])} tot ${formatDateForPDF(weekDates[weekDates.length - 1])}`,
        15,
        yPos
      );
      doc.setFont(undefined, 'normal');
      yPos += 7;

      // Calculate week averages
      const weekTotals = { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 };
      let weekDayCount = 0;

      weekDates.forEach(date => {
        if (dateGroups[date]) {
          weekDayCount++;
          const dayEntries = dateGroups[date];
          const dayTotal = dayEntries.reduce(
            (acc, e) => ({
              calories: acc.calories + (e.calories || 0),
              protein: acc.protein + (e.protein || 0),
              fat: acc.fat + (e.fat || 0),
              saturatedFat: acc.saturatedFat + (e.saturatedFat || 0),
              fiber: acc.fiber + (e.fiber || 0),
              sodium: acc.sodium + (e.sodium || 0),
            }),
            { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
          );

          weekTotals.calories += dayTotal.calories;
          weekTotals.protein += dayTotal.protein;
          weekTotals.fat += dayTotal.fat;
          weekTotals.saturatedFat += dayTotal.saturatedFat;
          weekTotals.fiber += dayTotal.fiber;
          weekTotals.sodium += dayTotal.sodium;
        }
      });

      const weekAvg = {
        calories: Math.round(weekTotals.calories / weekDayCount),
        protein: parseFloat((weekTotals.protein / weekDayCount).toFixed(1)),
        saturatedFat: parseFloat((weekTotals.saturatedFat / weekDayCount).toFixed(1)),
        fiber: parseFloat((weekTotals.fiber / weekDayCount).toFixed(1)),
        sodium: Math.round(weekTotals.sodium / weekDayCount),
      };

      // Week cards (smaller)
      const weekCardWidth = 30;
      const weekCardHeight = 14;
      let weekCardX = 20;

      const weekMetrics = [
        { key: 'calories', label: 'Cal', value: weekAvg.calories, unit: 'kcal' },
        { key: 'protein', label: 'Eiw', value: weekAvg.protein, unit: 'g' },
        { key: 'fiber', label: 'Vez', value: weekAvg.fiber, unit: 'g' },
        { key: 'saturatedFat', label: 'V.vet', value: weekAvg.saturatedFat, unit: 'g' },
        { key: 'sodium', label: 'Na', value: weekAvg.sodium, unit: 'mg' },
      ];

      weekMetrics.forEach(metric => {
        const color = getGradientColor(metric.value, metric.key);

        doc.setFillColor(color.r, color.g, color.b);
        doc.roundedRect(weekCardX, yPos, weekCardWidth, weekCardHeight, 2, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.text(metric.label, weekCardX + 2, yPos + 3.5);

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`${metric.value}${metric.unit}`, weekCardX + 2, yPos + 9);
        doc.setFont(undefined, 'normal');

        weekCardX += weekCardWidth + 2;
      });

      yPos += weekCardHeight + 8;
    });

    // Meals appendix starts on new page
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.setFont(undefined, 'bold');
    doc.text(`Bijlage: Maaltijden ${monthName}`, 15, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 10;

    // Daily meal details
    relevantDates.forEach(date => {
      const dayEntries = dateGroups[date];
      if (!dayEntries) return;

      // Check page space
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.setFont(undefined, 'bold');
      doc.text(formatDateForPDF(date), 15, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 6;

      const mealRows = dayEntries
        .sort((a, b) => a.time.localeCompare(b.time))
        .map(entry => [
          entry.time,
          entry.name,
          entry.calories || 0,
          (entry.protein || 0).toFixed(1),
          (entry.saturatedFat || 0).toFixed(1),
          (entry.fiber || 0).toFixed(1),
          entry.sodium || 0,
        ]);

      const dayTotal = dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + (e.calories || 0),
          protein: acc.protein + (e.protein || 0),
          saturatedFat: acc.saturatedFat + (e.saturatedFat || 0),
          fiber: acc.fiber + (e.fiber || 0),
          sodium: acc.sodium + (e.sodium || 0),
        }),
        { calories: 0, protein: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
      );

      mealRows.push([
        '',
        'TOTAAL',
        dayTotal.calories,
        dayTotal.protein.toFixed(1),
        dayTotal.saturatedFat.toFixed(1),
        dayTotal.fiber.toFixed(1),
        dayTotal.sodium,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Tijd', 'Maaltijd', 'Kcal', 'Eiw', 'V.vet', 'Vez', 'Natr']],
        body: mealRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 85 },
          2: { cellWidth: 20, halign: 'right' },
          3: { cellWidth: 15, halign: 'right' },
          4: { cellWidth: 15, halign: 'right' },
          5: { cellWidth: 15, halign: 'right' },
          6: { cellWidth: 15, halign: 'right' },
        },
        margin: { left: 15, right: 15 },
        didDrawPage: function (data) {
          yPos = data.cursor?.y || yPos;
        },
      });

      yPos += 5;
    });
  });

  // Page numbers
  const pageHeight = doc.internal.pageSize.height;
  for (let i = 1; i <= doc.internal.getNumberOfPages(); i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Pagina ${i} van ${doc.internal.getNumberOfPages()}`, 105, pageHeight - 10, { align: 'center' });
  }

  // Save PDF
  const fileName = `voedseljournaal_maandrapport_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
