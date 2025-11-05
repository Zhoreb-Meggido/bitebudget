/**
 * Export utilities for generating reports (TXT and PDF)
 */

import type { Entry } from '@/types';
import { calculateTotals } from './calculations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportOptions {
  startDate: string;
  endDate: string;
  entries: Entry[];
  format: 'csv' | 'pdf';
}

interface DailyReport {
  date: string;
  entries: Entry[];
  totals: {
    calories: number;
    protein: number;
    carbohydrates: number;
    sugars: number;
    fat: number;
    saturatedFat: number;
    fiber: number;
    sodium: number;
  };
}

/**
 * Group entries by date and calculate daily totals
 * Includes all calendar days in the range, even if they have no entries
 */
function groupEntriesByDate(entries: Entry[], startDate: string, endDate: string): DailyReport[] {
  // First, group existing entries by date
  const entriesByDate = new Map<string, Entry[]>();
  entries.forEach((entry) => {
    const existing = entriesByDate.get(entry.date) || [];
    existing.push(entry);
    entriesByDate.set(entry.date, existing);
  });

  // Generate all calendar days in the range
  const dailyReports: DailyReport[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const dayEntries = entriesByDate.get(dateStr) || [];

    dailyReports.push({
      date: dateStr,
      entries: dayEntries,
      totals: calculateTotals(dayEntries),
    });
  }

  return dailyReports;
}

/**
 * Generate TXT report
 */
export function generateTextReport(options: ExportOptions): string {
  const { startDate, endDate, entries } = options;

  const dailyReports = groupEntriesByDate(entries, startDate, endDate);

  let report = '';
  report += '='.repeat(80) + '\n';
  report += 'VOEDINGSJOURNAAL RAPPORTAGE\n';
  report += '='.repeat(80) + '\n';
  report += `Periode: ${new Date(startDate).toLocaleDateString('nl-NL')} - ${new Date(endDate).toLocaleDateString('nl-NL')}\n`;
  report += `Gegenereerd: ${new Date().toLocaleDateString('nl-NL')} ${new Date().toLocaleTimeString('nl-NL')}\n`;
  report += '='.repeat(80) + '\n\n';

  // Calculate overall totals and averages
  const allTotals = calculateTotals(entries);
  const daysWithData = dailyReports.length;

  if (daysWithData > 0) {
    report += 'SAMENVATTING\n';
    report += '-'.repeat(80) + '\n';
    report += `Dagen met data: ${daysWithData}\n`;
    report += `Totaal maaltijden: ${entries.length}\n\n`;

    report += 'Gemiddelde per dag:\n';
    report += `  Calorieën:      ${Math.round(allTotals.calories / daysWithData)} kcal\n`;
    report += `  Eiwit:          ${(allTotals.protein / daysWithData).toFixed(1)} g\n`;
    report += `  Koolhydraten:   ${(allTotals.carbohydrates / daysWithData).toFixed(1)} g\n`;
    report += `  Suikers:        ${(allTotals.sugars / daysWithData).toFixed(1)} g\n`;
    report += `  Vet:            ${(allTotals.fat / daysWithData).toFixed(1)} g\n`;
    report += `  Verzadigd vet:  ${(allTotals.saturatedFat / daysWithData).toFixed(1)} g\n`;
    report += `  Vezels:         ${(allTotals.fiber / daysWithData).toFixed(1)} g\n`;
    report += `  Natrium:        ${Math.round(allTotals.sodium / daysWithData)} mg\n`;
    report += '\n' + '='.repeat(80) + '\n\n';
  }

  // Daily breakdown (only show days with entries)
  dailyReports
    .filter(day => day.entries.length > 0)
    .forEach((day) => {
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString('nl-NL', { weekday: 'long' });

      report += `${dayName} ${date.toLocaleDateString('nl-NL')}\n`;
      report += '-'.repeat(80) + '\n';

      day.entries.forEach((entry) => {
        report += `${entry.time} - ${entry.name}\n`;
        report += `  Calorieën: ${entry.calories || 0} kcal | Eiwit: ${(entry.protein || 0).toFixed(1)}g | `;
        report += `Koolh: ${(entry.carbohydrates || 0).toFixed(1)}g | Vet: ${(entry.fat || 0).toFixed(1)}g\n`;
      });

      report += '\nDag totaal:\n';
      report += `  Calorieën: ${day.totals.calories || 0} kcal\n`;
      report += `  Eiwit: ${(day.totals.protein || 0).toFixed(1)} g | Koolhydraten: ${(day.totals.carbohydrates || 0).toFixed(1)} g | Vet: ${(day.totals.fat || 0).toFixed(1)} g\n`;
      report += `  Suikers: ${(day.totals.sugars || 0).toFixed(1)} g | Verz.vet: ${(day.totals.saturatedFat || 0).toFixed(1)} g | `;
      report += `Vezels: ${(day.totals.fiber || 0).toFixed(1)} g | Natrium: ${day.totals.sodium || 0} mg\n`;
      report += '\n';
    });

  return report;
}

/**
 * Generate PDF report
 */
export function generatePDFReport(options: ExportOptions): jsPDF {
  const { startDate, endDate, entries } = options;
  const dailyReports = groupEntriesByDate(entries, startDate, endDate);

  const doc = new jsPDF();
  const marginLeft = 15;
  let yPos = 20;
  const lineHeight = 6;
  const pageHeight = doc.internal.pageSize.height;

  // Helper function to add new page if needed
  const checkPageBreak = (neededSpace: number = lineHeight) => {
    if (yPos + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text('Voedingsjournaal Rapportage', 15, yPos);
  yPos += 10;

  // Period
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Periode: ${new Date(startDate).toLocaleDateString('nl-NL')} - ${new Date(endDate).toLocaleDateString('nl-NL')}`, marginLeft, yPos);
  yPos += 5;
  doc.text(`Gegenereerd: ${new Date().toLocaleDateString('nl-NL')} ${new Date().toLocaleTimeString('nl-NL')}`, marginLeft, yPos);
  yPos += 10;

  const daysWithData = dailyReports.length;

  // Weekly Summary Tables (for 8-30 day periods)
  if (daysWithData >= 8 && daysWithData <= 30) {
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text('WEEKOVERZICHT', marginLeft, yPos);
    yPos += 8;

    // Group days into weeks (7-day chunks, not calendar weeks)
    const weekGroups: DailyReport[][] = [];

    for (let i = 0; i < dailyReports.length; i += 7) {
      const week = dailyReports.slice(i, i + 7);
      weekGroups.push(week);
    }

    // Render each week as a table using autoTable
    weekGroups.forEach((week, weekIndex) => {
      // Check if there's enough space for the entire week (cards + graph + table)
      // Estimate: ~120mm needed for cards (14) + graph (48) + table (50) + spacing
      const estimatedWeekHeight = 120;
      const pageHeight = doc.internal.pageSize.height;

      if (yPos + estimatedWeekHeight > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      const weekStart = new Date(week[0].date);
      const weekEnd = new Date(week[week.length - 1].date);
      doc.text(
        `Week ${weekIndex + 1}: ${weekStart.toLocaleDateString('nl-NL')} - ${weekEnd.toLocaleDateString('nl-NL')}`,
        marginLeft,
        yPos
      );
      yPos += 7;

      // Filter only days with entries for this week
      const daysWithEntries = week.filter(day => day.entries.length > 0);

      // Skip week if no entries at all
      if (daysWithEntries.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text('Geen maaltijden deze week', marginLeft, yPos);
        yPos += 10;
        return;
      }

      // Build table data (only days with entries)
      const weekTotals = { calories: 0, protein: 0, carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 };

      const weekRows = daysWithEntries.map((day) => {
        const date = new Date(day.date);
        const dayStr = date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });

        // Accumulate totals
        weekTotals.calories += (day.totals.calories || 0);
        weekTotals.protein += (day.totals.protein || 0);
        weekTotals.carbohydrates += (day.totals.carbohydrates || 0);
        weekTotals.sugars += (day.totals.sugars || 0);
        weekTotals.fat += (day.totals.fat || 0);
        weekTotals.saturatedFat += (day.totals.saturatedFat || 0);
        weekTotals.fiber += (day.totals.fiber || 0);
        weekTotals.sodium += (day.totals.sodium || 0);

        return [
          dayStr,
          (day.totals.calories || 0).toString(),
          (day.totals.protein || 0).toFixed(0),
          (day.totals.carbohydrates || 0).toFixed(0),
          (day.totals.sugars || 0).toFixed(0),
          (day.totals.fat || 0).toFixed(0),
          (day.totals.saturatedFat || 0).toFixed(0),
          (day.totals.fiber || 0).toFixed(0),
          (day.totals.sodium || 0).toString(),
        ];
      });

      // Calculate averages
      const weekDays = daysWithEntries.length;
      const avgCalories = Math.round(weekTotals.calories / weekDays);
      const avgProtein = Math.round(weekTotals.protein / weekDays);
      const avgCarbs = Math.round(weekTotals.carbohydrates / weekDays);
      const avgSaturatedFat = Math.round(weekTotals.saturatedFat / weekDays);
      const avgFiber = Math.round(weekTotals.fiber / weekDays);
      const avgSodium = Math.round(weekTotals.sodium / weekDays);

      // Draw 6 metric cards
      const cardWidth = 30;
      const cardHeight = 14;
      const cardSpacing = 2;
      const cardY = yPos;
      let cardX = marginLeft;

      // Helper to get color based on metric and value
      const getMetricColor = (metric: string, value: number): [number, number, number] => {
        switch (metric) {
          case 'calories':
            return value < 1900 ? [34, 197, 94] : value < 2100 ? [234, 179, 8] : [239, 68, 68]; // green/yellow/red
          case 'protein':
            return value >= 72 ? [34, 197, 94] : value >= 36 ? [234, 179, 8] : [239, 68, 68];
          case 'saturatedFat':
            return value < 20 ? [34, 197, 94] : value < 25 ? [234, 179, 8] : [239, 68, 68];
          case 'fiber':
            return value >= 35 ? [34, 197, 94] : value >= 17.5 ? [234, 179, 8] : [239, 68, 68];
          case 'sodium':
            return value < 2300 ? [34, 197, 94] : value < 2800 ? [234, 179, 8] : [239, 68, 68];
          default:
            return [107, 114, 128]; // gray for carbs
        }
      };

      const metrics = [
        { label: 'Cal', value: avgCalories, unit: 'kcal', key: 'calories' },
        { label: 'Eiwit', value: avgProtein, unit: 'g', key: 'protein' },
        { label: 'Koolh', value: avgCarbs, unit: 'g', key: 'carbs' },
        { label: 'V.vet', value: avgSaturatedFat, unit: 'g', key: 'saturatedFat' },
        { label: 'Vezels', value: avgFiber, unit: 'g', key: 'fiber' },
        { label: 'Na', value: avgSodium, unit: 'mg', key: 'sodium' },
      ];

      metrics.forEach((metric) => {
        const color = getMetricColor(metric.key, metric.value);

        // Draw card background
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1, 1, 'F');

        // Draw label (white text, small)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text(metric.label, cardX + cardWidth / 2, cardY + 4, { align: 'center' });

        // Draw value (white text, larger)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${metric.value}`, cardX + cardWidth / 2, cardY + 9, { align: 'center' });

        // Draw unit (white text, small)
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(metric.unit, cardX + cardWidth / 2, cardY + 12, { align: 'center' });

        cardX += cardWidth + cardSpacing;
      });

      yPos += cardHeight + 5;

      // Draw line graph for the week (showing all 6 metrics)
      const graphHeight = 35;
      const graphWidth = 165;
      const graphPaddingLeft = 10; // Space for Y-axis labels
      const graphPaddingBottom = 8; // Space for X-axis labels
      const graphX = marginLeft + graphPaddingLeft;
      const graphY = yPos;

      // Prepare data for all days in the week (including days without entries as 0)
      const graphData = week.map(day => ({
        date: day.date,
        calories: day.totals.calories || 0,
        protein: day.totals.protein || 0,
        carbohydrates: day.totals.carbohydrates || 0,
        saturatedFat: day.totals.saturatedFat || 0,
        fiber: day.totals.fiber || 0,
        sodium: day.totals.sodium || 0,
      }));

      // Draw graph background
      doc.setFillColor(250, 250, 250);
      doc.rect(graphX, graphY, graphWidth, graphHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(graphX, graphY, graphWidth, graphHeight, 'S');

      // Draw grid lines (horizontal)
      doc.setDrawColor(230, 230, 230);
      for (let i = 1; i <= 4; i++) {
        const gridY = graphY + (graphHeight / 5) * i;
        doc.line(graphX, gridY, graphX + graphWidth, gridY);
      }

      // Draw Y-axis labels (0%, 50%, 100%)
      doc.setFontSize(5);
      doc.setTextColor(100, 100, 100);
      const yLabels = ['100%', '75%', '50%', '25%', '0%'];
      yLabels.forEach((label, i) => {
        const labelY = graphY + (graphHeight / 5) * i + 1.5;
        doc.text(label, graphX - 2, labelY, { align: 'right' });
      });

      // Helper to normalize values to graph scale (0-100 scale for each metric)
      const normalizeValue = (value: number, metric: string): number => {
        let max = 100;
        switch (metric) {
          case 'calories': max = 2500; break;
          case 'protein': max = 100; break;
          case 'carbohydrates': max = 300; break;
          case 'saturatedFat': max = 30; break;
          case 'fiber': max = 50; break;
          case 'sodium': max = 3000; break;
        }
        return Math.min(100, (value / max) * 100);
      };

      // Draw lines for each metric
      const lineMetrics = [
        { key: 'calories', color: [59, 130, 246], label: 'Cal' }, // blue
        { key: 'protein', color: [147, 51, 234], label: 'Prot' }, // purple
        { key: 'carbohydrates', color: [245, 158, 11], label: 'Carb' }, // orange
        { key: 'saturatedFat', color: [239, 68, 68], label: 'SFat' }, // red
        { key: 'fiber', color: [34, 197, 94], label: 'Fiber' }, // green
        { key: 'sodium', color: [249, 115, 22], label: 'Na' }, // dark orange
      ];

      // Calculate point spacing so lines start and end at edges
      const pointSpacing = graphData.length > 1 ? graphWidth / (graphData.length - 1) : 0;

      lineMetrics.forEach(lineMetric => {
        doc.setDrawColor(lineMetric.color[0], lineMetric.color[1], lineMetric.color[2]);
        doc.setLineWidth(0.5);

        for (let i = 0; i < graphData.length - 1; i++) {
          const x1 = graphX + pointSpacing * i;
          const x2 = graphX + pointSpacing * (i + 1);

          const value1 = (graphData[i] as any)[lineMetric.key];
          const value2 = (graphData[i + 1] as any)[lineMetric.key];

          const y1 = graphY + graphHeight - (normalizeValue(value1, lineMetric.key) / 100) * graphHeight;
          const y2 = graphY + graphHeight - (normalizeValue(value2, lineMetric.key) / 100) * graphHeight;

          doc.line(x1, y1, x2, y2);
        }
      });

      // Draw X-axis labels (day names)
      doc.setFontSize(5);
      doc.setTextColor(100, 100, 100);
      graphData.forEach((data, i) => {
        const date = new Date(data.date);
        const dayName = date.toLocaleDateString('nl-NL', { weekday: 'short' }).substring(0, 2); // ma, di, wo, etc.
        const labelX = graphX + pointSpacing * i;
        const labelY = graphY + graphHeight + 4;
        doc.text(dayName, labelX, labelY, { align: 'center' });
      });

      // Draw legend
      const legendX = graphX + graphWidth + 3;
      let legendY = graphY + 5;
      doc.setFontSize(6);

      lineMetrics.forEach(lineMetric => {
        doc.setFillColor(lineMetric.color[0], lineMetric.color[1], lineMetric.color[2]);
        doc.rect(legendX, legendY - 1.5, 3, 2, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text(lineMetric.label, legendX + 4, legendY);
        legendY += 3;
      });

      yPos += graphHeight + graphPaddingBottom + 5;

      // Reset text color and line width for rest of content
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setLineWidth(0.1);
      doc.setDrawColor(0, 0, 0);

      // Create average row for table
      const averageRow = [
        'Gemiddeld',
        avgCalories.toString(),
        avgProtein.toString(),
        avgCarbs.toString(),
        (weekTotals.sugars / weekDays).toFixed(0),
        (weekTotals.fat / weekDays).toFixed(0),
        avgSaturatedFat.toString(),
        avgFiber.toString(),
        avgSodium.toString(),
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Dag', 'Cal', 'Prot', 'Carb', 'Sugr', 'Fat', 'SFat', 'Fib', 'Na']],
        body: weekRows,
        foot: [averageRow],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
        footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 10, halign: 'right' },
          2: { cellWidth: 10, halign: 'right' },
          3: { cellWidth: 10, halign: 'right' },
          4: { cellWidth: 10, halign: 'right' },
          5: { cellWidth: 10, halign: 'right' },
          6: { cellWidth: 10, halign: 'right' },
          7: { cellWidth: 10, halign: 'right' },
          8: { cellWidth: 10, halign: 'right' },
        },
        margin: { left: marginLeft },
        didDrawPage: function (data) {
          yPos = data.cursor?.y || yPos;
        },
      });

      yPos += 8;
    });

    yPos += 5;
  }

  // Daily breakdown using autoTable (only show days with entries)
  const showDetailedMeals = daysWithData <= 30; // Show meal details only for periods <= 30 days

  dailyReports
    .filter(day => day.entries.length > 0)
    .forEach((day, dayIndex) => {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      const date = new Date(day.date);
      const dayName = date.toLocaleDateString('nl-NL', { weekday: 'long' });

      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.text(`${dayName} ${date.toLocaleDateString('nl-NL')}`, marginLeft, yPos);
      yPos += 6;

      if (showDetailedMeals) {
      // Build meal table with all 8 metrics
      const mealRows = day.entries
        .sort((a, b) => a.time.localeCompare(b.time))
        .map(entry => [
          entry.time,
          entry.name,
          (entry.calories || 0).toString(),
          (entry.protein || 0).toFixed(1),
          (entry.carbohydrates || 0).toFixed(1),
          (entry.sugars || 0).toFixed(1),
          (entry.fat || 0).toFixed(1),
          (entry.saturatedFat || 0).toFixed(1),
          (entry.fiber || 0).toFixed(1),
          (entry.sodium || 0).toString(),
        ]);

      // Add day total row
      mealRows.push([
        '',
        'TOTAAL',
        (day.totals.calories || 0).toString(),
        (day.totals.protein || 0).toFixed(1),
        (day.totals.carbohydrates || 0).toFixed(1),
        (day.totals.sugars || 0).toFixed(1),
        (day.totals.fat || 0).toFixed(1),
        (day.totals.saturatedFat || 0).toFixed(1),
        (day.totals.fiber || 0).toFixed(1),
        (day.totals.sodium || 0).toString(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Tijd', 'Maaltijd', 'Cal', 'Prot', 'Carb', 'Sugr', 'Fat', 'SFat', 'Fib', 'Na']],
        body: mealRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontSize: 7 },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 70 },
          2: { cellWidth: 12, halign: 'right' },
          3: { cellWidth: 12, halign: 'right' },
          4: { cellWidth: 12, halign: 'right' },
          5: { cellWidth: 12, halign: 'right' },
          6: { cellWidth: 12, halign: 'right' },
          7: { cellWidth: 12, halign: 'right' },
          8: { cellWidth: 12, halign: 'right' },
          9: { cellWidth: 12, halign: 'right' },
        },
        margin: { left: marginLeft, right: 15 },
        didDrawPage: function (data) {
          yPos = data.cursor?.y || yPos;
        },
      });
    } else {
      // For long periods, show only day totals as a simple table
      autoTable(doc, {
        startY: yPos,
        head: [['Cal', 'Prot', 'Carb', 'Sugr', 'Fat', 'SFat', 'Fib', 'Na']],
        body: [[
          (day.totals.calories || 0).toString(),
          (day.totals.protein || 0).toFixed(1),
          (day.totals.carbohydrates || 0).toFixed(1),
          (day.totals.sugars || 0).toFixed(1),
          (day.totals.fat || 0).toFixed(1),
          (day.totals.saturatedFat || 0).toFixed(1),
          (day.totals.fiber || 0).toFixed(1),
          (day.totals.sodium || 0).toString(),
        ]],
        theme: 'plain',
        headStyles: { fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 18, halign: 'right' },
          1: { cellWidth: 18, halign: 'right' },
          2: { cellWidth: 18, halign: 'right' },
          3: { cellWidth: 18, halign: 'right' },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 18, halign: 'right' },
          7: { cellWidth: 18, halign: 'right' },
        },
        margin: { left: marginLeft },
        didDrawPage: function (data) {
          yPos = data.cursor?.y || yPos;
        },
      });
    }

    yPos += 5;
  });

  return doc;
}

/**
 * Generate CSV report
 * Excel-compatible format with UTF-8 BOM and CRLF line endings
 */
export function generateCSVReport(options: ExportOptions): string {
  const { entries } = options;

  // CSV Header
  const header = 'Date,Weekday,Time,Meal Name,Calories,Protein,Carbohydrates,Sugars,Fat,Saturated Fat,Fiber,Sodium';

  // Sort entries by date and time
  const sortedEntries = [...entries].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  // Generate rows
  const rows = sortedEntries.map(entry => {
    const date = new Date(entry.date);
    const weekday = date.toLocaleDateString('nl-NL', { weekday: 'long' });

    // Escape meal name for CSV (handle commas and quotes)
    const escapedName = entry.name.includes(',') || entry.name.includes('"')
      ? `"${entry.name.replace(/"/g, '""')}"`
      : entry.name;

    return [
      entry.date,
      weekday,
      entry.time,
      escapedName,
      entry.calories || 0,
      (entry.protein || 0).toFixed(1),
      (entry.carbohydrates || 0).toFixed(1),
      (entry.sugars || 0).toFixed(1),
      (entry.fat || 0).toFixed(1),
      (entry.saturatedFat || 0).toFixed(1),
      (entry.fiber || 0).toFixed(1),
      entry.sodium || 0
    ].join(',');
  });

  // Combine with CRLF line endings for Excel compatibility
  return header + '\r\n' + rows.join('\r\n');
}

/**
 * Download CSV file
 * Uses UTF-8 BOM for Excel compatibility
 */
export function downloadCSVReport(options: ExportOptions) {
  const content = generateCSVReport(options);

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const filename = `voedingsjournaal_${options.startDate}_${options.endDate}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download TXT file
 * @deprecated Use downloadCSVReport instead for better Excel compatibility
 */
export function downloadTextReport(options: ExportOptions) {
  const content = generateTextReport(options);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const filename = `voedingsjournaal_${options.startDate}_${options.endDate}.txt`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download PDF file
 */
export function downloadPDFReport(options: ExportOptions) {
  const pdf = generatePDFReport(options);
  const filename = `voedingsjournaal_${options.startDate}_${options.endDate}.pdf`;
  pdf.save(filename);
}
