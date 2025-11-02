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
  let yPos = 20;
  const lineHeight = 7;
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
  doc.text(`Periode: ${new Date(startDate).toLocaleDateString('nl-NL')} - ${new Date(endDate).toLocaleDateString('nl-NL')}`, 20, yPos);
  yPos += lineHeight;
  doc.text(`Gegenereerd: ${new Date().toLocaleDateString('nl-NL')} ${new Date().toLocaleTimeString('nl-NL')}`, 20, yPos);
  yPos += lineHeight * 2;

  // Summary
  const allTotals = calculateTotals(entries);
  const daysWithData = dailyReports.length;

  if (daysWithData > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('SAMENVATTING', 20, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.text(`Dagen met data: ${daysWithData} | Totaal maaltijden: ${entries.length}`, 20, yPos);
    yPos += lineHeight * 1.5;

    doc.setFont('helvetica', 'bold');
    doc.text('Gemiddelde per dag:', 20, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Calorieën: ${Math.round(allTotals.calories / daysWithData)} kcal`, 25, yPos);
    doc.text(`Eiwit: ${(allTotals.protein / daysWithData).toFixed(1)} g`, 80, yPos);
    doc.text(`Koolhydraten: ${(allTotals.carbohydrates / daysWithData).toFixed(1)} g`, 130, yPos);
    yPos += lineHeight;

    doc.text(`Suikers: ${(allTotals.sugars / daysWithData).toFixed(1)} g`, 25, yPos);
    doc.text(`Vet: ${(allTotals.fat / daysWithData).toFixed(1)} g`, 80, yPos);
    doc.text(`Vezels: ${(allTotals.fiber / daysWithData).toFixed(1)} g`, 130, yPos);
    yPos += lineHeight;

    doc.text(`Verzadigd vet: ${(allTotals.saturatedFat / daysWithData).toFixed(1)} g`, 25, yPos);
    doc.text(`Natrium: ${Math.round(allTotals.sodium / daysWithData)} mg`, 80, yPos);
    yPos += lineHeight * 2;
  }

  // Daily breakdown
  doc.setFontSize(10);
  dailyReports.forEach((day, dayIndex) => {
    checkPageBreak(lineHeight * 5);

    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('nl-NL', { weekday: 'long' });

    doc.setFont('helvetica', 'bold');
    doc.text(`${dayName} ${date.toLocaleDateString('nl-NL')}`, 20, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    day.entries.forEach((entry) => {
      checkPageBreak(lineHeight * 2);

      doc.text(`${entry.time} - ${entry.name}`, 25, yPos);
      yPos += lineHeight;

      const nutritionText = `${entry.calories} kcal | Eiwit: ${entry.protein.toFixed(1)}g | Koolh: ${entry.carbohydrates.toFixed(1)}g | Vet: ${entry.fat.toFixed(1)}g`;
      doc.text(nutritionText, 30, yPos);
      yPos += lineHeight;
    });

    checkPageBreak(lineHeight * 3);

    doc.setFont('helvetica', 'bold');
    doc.text('Dag totaal:', 25, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.text(`${day.totals.calories} kcal | Eiwit: ${day.totals.protein.toFixed(1)}g | Koolh: ${day.totals.carbohydrates.toFixed(1)}g | Vet: ${day.totals.fat.toFixed(1)}g`, 30, yPos);
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
