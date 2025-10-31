/**
 * Report generation utilities
 *
 * Functions for generating TXT and PDF reports from journal entries
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadTextFile } from './download.utils';
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
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          fat: acc.fat + e.fat,
          saturatedFat: acc.saturatedFat + e.saturatedFat,
          fiber: acc.fiber + e.fiber,
          sodium: acc.sodium + e.sodium,
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
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        fat: acc.fat + e.fat,
        saturatedFat: acc.saturatedFat + e.saturatedFat,
        fiber: acc.fiber + e.fiber,
        sodium: acc.sodium + e.sodium,
      }),
      { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
    );

    report += `📅 ${date}\n`;
    report += '-'.repeat(60) + '\n';
    dayEntries.forEach(entry => {
      report += `${entry.time} - ${entry.name}\n`;
      report += `  Kcal: ${entry.calories}, Eiwit: ${entry.protein.toFixed(1)}g, Vet: ${entry.fat.toFixed(1)}g, `;
      report += `Verz.vet: ${entry.saturatedFat.toFixed(1)}g, Vezels: ${entry.fiber.toFixed(1)}g, Natrium: ${entry.sodium}mg\n`;
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
      const calGoal = 1900;
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
 * Generate PDF report
 */
export function generatePdfReport(entries: Entry[], options: ReportOptions = { days: 14 }): void {
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

    // Calculate week averages
    const weekTotals = { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 };
    let dayCount = 0;

    weekDates.forEach(date => {
      if (dateGroups[date]) {
        dayCount++;
        const dayEntries = dateGroups[date];
        const dayTotal = dayEntries.reduce(
          (acc, e) => ({
            calories: acc.calories + e.calories,
            protein: acc.protein + e.protein,
            fat: acc.fat + e.fat,
            saturatedFat: acc.saturatedFat + e.saturatedFat,
            fiber: acc.fiber + e.fiber,
            sodium: acc.sodium + e.sodium,
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
      calories: Math.round(weekTotals.calories / dayCount),
      protein: parseFloat((weekTotals.protein / dayCount).toFixed(1)),
      fat: parseFloat((weekTotals.fat / dayCount).toFixed(1)),
      saturatedFat: parseFloat((weekTotals.saturatedFat / dayCount).toFixed(1)),
      fiber: parseFloat((weekTotals.fiber / dayCount).toFixed(1)),
      sodium: Math.round(weekTotals.sodium / dayCount),
    };

    // Gradient Cards
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text('Weekgemiddelden:', 15, yPos);
    yPos += 7;

    const cardWidth = 35;
    const cardHeight = 16;
    const cardSpacing = 3;
    let cardX = 15;

    const metrics = [
      { key: 'calories', label: 'Calorieën', value: weekAvg.calories, unit: 'kcal', target: '<1900' },
      { key: 'protein', label: 'Eiwit', value: weekAvg.protein, unit: 'g', target: '110-120' },
      { key: 'fiber', label: 'Vezels', value: weekAvg.fiber, unit: 'g', target: '>=35' },
      { key: 'saturatedFat', label: 'Verz. vet', value: weekAvg.saturatedFat, unit: 'g', target: '<20' },
      { key: 'sodium', label: 'Natrium', value: weekAvg.sodium, unit: 'mg', target: '<2300' },
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

    yPos += cardHeight + 8;

    // Daily details table
    weekDates.forEach(date => {
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
          entry.calories,
          entry.protein.toFixed(1),
          entry.saturatedFat.toFixed(1),
          entry.fiber.toFixed(1),
          entry.sodium,
        ]);

      const dayTotal = dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          saturatedFat: acc.saturatedFat + e.saturatedFat,
          fiber: acc.fiber + e.fiber,
          sodium: acc.sodium + e.sodium,
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

    yPos += 5;
  }

  // Overall summary
  if (yPos > 180) {
    doc.addPage();
    yPos = 20;
  }

  const overallTotals = { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 };
  let totalDays = 0;

  relevantDates.forEach(date => {
    if (dateGroups[date]) {
      totalDays++;
      const dayEntries = dateGroups[date];
      const dayTotal = dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          fat: acc.fat + e.fat,
          saturatedFat: acc.saturatedFat + e.saturatedFat,
          fiber: acc.fiber + e.fiber,
          sodium: acc.sodium + e.sodium,
        }),
        { calories: 0, protein: 0, fat: 0, saturatedFat: 0, fiber: 0, sodium: 0 }
      );

      overallTotals.calories += dayTotal.calories;
      overallTotals.protein += dayTotal.protein;
      overallTotals.fat += dayTotal.fat;
      overallTotals.saturatedFat += dayTotal.saturatedFat;
      overallTotals.fiber += dayTotal.fiber;
      overallTotals.sodium += dayTotal.sodium;
    }
  });

  const overallAvg = {
    calories: Math.round(overallTotals.calories / totalDays),
    protein: parseFloat((overallTotals.protein / totalDays).toFixed(1)),
    fat: parseFloat((overallTotals.fat / totalDays).toFixed(1)),
    saturatedFat: parseFloat((overallTotals.saturatedFat / totalDays).toFixed(1)),
    fiber: parseFloat((overallTotals.fiber / totalDays).toFixed(1)),
    sodium: Math.round(overallTotals.sodium / totalDays),
  };

  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.setFont(undefined, 'bold');
  doc.text('Totaaloverzicht', 15, yPos);
  doc.setFont(undefined, 'normal');
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Gemiddelden over ${totalDays} dagen:`, 15, yPos);
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Gemiddelde', 'Doel/Limiet']],
    body: [
      ['Calorieën', `${overallAvg.calories} kcal`, '< 1900 kcal'],
      ['Eiwit', `${overallAvg.protein}g`, '110-120g'],
      ['Totaal Vet', `${overallAvg.fat}g`, '-'],
      ['Verzadigd Vet', `${overallAvg.saturatedFat}g`, '< 20g'],
      ['Vezels', `${overallAvg.fiber}g`, '>= 35g'],
      ['Natrium', `${overallAvg.sodium}mg`, '< 2300mg'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [31, 41, 55] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 50, halign: 'right' },
    },
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
