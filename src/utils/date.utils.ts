/**
 * Date utility functies
 */

/**
 * Get vandaag in yyyy-MM-dd formaat
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get huidige tijd in HH:mm formaat
 */
export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

/**
 * Format date van yyyy-MM-dd naar dd-MM-yyyy
 */
export function formatDateForDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
}

/**
 * Format date van yyyy-MM-dd naar Nederlandse leesbare vorm
 */
export function formatDateNL(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get ISO timestamp voor created_at/updated_at velden
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate unique ID gebaseerd op timestamp
 */
export function generateId(): number {
  return Date.now() + Math.random();
}
