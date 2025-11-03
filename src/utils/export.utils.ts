/**
 * Export utilities for generating reports (TXT and PDF)
 */

import type { Entry } from '@/types';
import { calculateTotals } from './calculations';
import jsPDF from 'jspdf';

interface ExportOptions {
  startDate: string;
  endDate: string;
  entries: Entry[];
  format: 'txt' | 'pdf';
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
 */
function groupEntriesByDate(entries: Entry[]): DailyReport[] {
  const days = new Map<string, Entry[]>();

  entries.forEach((entry) => {
    const existing = days.get(entry.date) || [];
    existing.push(entry);
    days.set(entry.date, existing);
  });

  return Array.from(days.entries())
    .map(([date, entries]) => ({
      date,
      entries,
      totals: calculateTotals(entries),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate TXT report
 */
export function generateTextReport(options: ExportOptions): string {
  const { startDate, endDate, entries } = options;

  const dailyReports = groupEntriesByDate(entries);

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

  // Daily breakdown
  dailyReports.forEach((day) => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('nl-NL', { weekday: 'long' });

    report += `${dayName} ${date.toLocaleDateString('nl-NL')}\n`;
    report += '-'.repeat(80) + '\n';

    day.entries.forEach((entry) => {
      report += `${entry.time} - ${entry.name}\n`;
      report += `  Calorieën: ${entry.calories} kcal | Eiwit: ${entry.protein.toFixed(1)}g | `;
      report += `Koolh: ${entry.carbohydrates.toFixed(1)}g | Vet: ${entry.fat.toFixed(1)}g\n`;
    });

    report += '\nDag totaal:\n';
    report += `  Calorieën: ${day.totals.calories} kcal\n`;
    report += `  Eiwit: ${day.totals.protein.toFixed(1)} g | Koolhydraten: ${day.totals.carbohydrates.toFixed(1)} g | Vet: ${day.totals.fat.toFixed(1)} g\n`;
    report += `  Suikers: ${day.totals.sugars.toFixed(1)} g | Verz.vet: ${day.totals.saturatedFat.toFixed(1)} g | `;
    report += `Vezels: ${day.totals.fiber.toFixed(1)} g | Natrium: ${day.totals.sodium} mg\n`;
    report += '\n';
  });

  return report;
}

/**
 * Generate PDF report
 */
export function generatePDFReport(options: ExportOptions): jsPDF {
  const { startDate, endDate, entries } = options;
  const dailyReports = groupEntriesByDate(entries);

  const doc = new jsPDF();
  const marginLeft = 15; // 15mm margins
  const marginRight = 15;
  let yPos = 20;
  const lineHeight = 6; // Reduced from 7 to fit more content
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
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Voedingsjournaal Rapportage', 105, yPos, { align: 'center' });
  yPos += lineHeight * 2;

  // Period
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${new Date(startDate).toLocaleDateString('nl-NL')} - ${new Date(endDate).toLocaleDateString('nl-NL')}`, marginLeft, yPos);
  yPos += lineHeight;
  doc.text(`Gegenereerd: ${new Date().toLocaleDateString('nl-NL')} ${new Date().toLocaleTimeString('nl-NL')}`, marginLeft, yPos);
  yPos += lineHeight * 2;

  // Summary
  const allTotals = calculateTotals(entries);
  const daysWithData = dailyReports.length;

  if (daysWithData > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('SAMENVATTING', marginLeft, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.text(`Dagen met data: ${daysWithData} | Totaal maaltijden: ${entries.length}`, marginLeft, yPos);
    yPos += lineHeight * 1.5;

    doc.setFont('helvetica', 'bold');
    doc.text('Gemiddelde per dag:', marginLeft, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); // Reduced to 8pt
    const col1 = marginLeft + 5;
    const col2 = 75;
    const col3 = 135;

    doc.text(`Cal: ${Math.round(allTotals.calories / daysWithData)} kcal`, col1, yPos);
    doc.text(`Prot: ${(allTotals.protein / daysWithData).toFixed(1)}g`, col2, yPos);
    doc.text(`Carb: ${(allTotals.carbohydrates / daysWithData).toFixed(1)}g`, col3, yPos);
    yPos += lineHeight;

    doc.text(`Sugr: ${(allTotals.sugars / daysWithData).toFixed(1)}g`, col1, yPos);
    doc.text(`Fat: ${(allTotals.fat / daysWithData).toFixed(1)}g`, col2, yPos);
    doc.text(`SFat: ${(allTotals.saturatedFat / daysWithData).toFixed(1)}g`, col3, yPos);
    yPos += lineHeight;

    doc.text(`Fiber: ${(allTotals.fiber / daysWithData).toFixed(1)}g`, col1, yPos);
    doc.text(`Na: ${Math.round(allTotals.sodium / daysWithData)}mg`, col2, yPos);
    yPos += lineHeight * 2;
  }

  // Daily breakdown
  doc.setFontSize(10);
  dailyReports.forEach((day, dayIndex) => {
    checkPageBreak(lineHeight * 6);

    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('nl-NL', { weekday: 'long' });

    doc.setFont('helvetica', 'bold');
    doc.text(`${dayName} ${date.toLocaleDateString('nl-NL')}`, marginLeft, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); // 8pt for meal entries

    const col1 = marginLeft + 5;
    const col2 = 75;
    const col3 = 135;

    day.entries.forEach((entry) => {
      checkPageBreak(lineHeight * 3); // Need 3 lines: name + 2 metric lines

      // Line 1: Time and meal name
      doc.text(`${entry.time} - ${entry.name}`, col1, yPos);
      yPos += lineHeight;

      // Line 2: Cal, Prot, Carb, Sugr (4 metrics)
      doc.text(`Cal: ${entry.calories}`, col1 + 5, yPos);
      doc.text(`Prot: ${entry.protein.toFixed(1)}g`, col2 - 10, yPos);
      doc.text(`Carb: ${entry.carbohydrates.toFixed(1)}g`, col2 + 20, yPos);
      doc.text(`Sugr: ${entry.sugars.toFixed(1)}g`, col3, yPos);
      yPos += lineHeight;

      // Line 3: Fat, SFat, Fiber, Na (4 metrics)
      doc.text(`Fat: ${entry.fat.toFixed(1)}g`, col1 + 5, yPos);
      doc.text(`SFat: ${entry.saturatedFat.toFixed(1)}g`, col2 - 10, yPos);
      doc.text(`Fiber: ${entry.fiber.toFixed(1)}g`, col2 + 20, yPos);
      doc.text(`Na: ${entry.sodium}mg`, col3, yPos);
      yPos += lineHeight;
    });

    checkPageBreak(lineHeight * 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Dag totaal:', col1, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    // Day totals - same 2-line format as meals
    // Line 1: Cal, Prot, Carb, Sugr
    doc.text(`Cal: ${day.totals.calories}`, col1 + 5, yPos);
    doc.text(`Prot: ${day.totals.protein.toFixed(1)}g`, col2 - 10, yPos);
    doc.text(`Carb: ${day.totals.carbohydrates.toFixed(1)}g`, col2 + 20, yPos);
    doc.text(`Sugr: ${day.totals.sugars.toFixed(1)}g`, col3, yPos);
    yPos += lineHeight;

    // Line 2: Fat, SFat, Fiber, Na
    doc.text(`Fat: ${day.totals.fat.toFixed(1)}g`, col1 + 5, yPos);
    doc.text(`SFat: ${day.totals.saturatedFat.toFixed(1)}g`, col2 - 10, yPos);
    doc.text(`Fiber: ${day.totals.fiber.toFixed(1)}g`, col2 + 20, yPos);
    doc.text(`Na: ${day.totals.sodium}mg`, col3, yPos);
    yPos += lineHeight;

    if (dayIndex < dailyReports.length - 1) {
      yPos += lineHeight;
    }
  });

  return doc;
}

/**
 * Download TXT file
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
