/**
 * Date utilities for consistent timezone-aware date handling
 */

/**
 * Get the current date in the user's local timezone as YYYY-MM-DD format
 * This ensures consistency across all date comparisons
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a date string (YYYY-MM-DD) to a Date object in the user's local timezone
 * This prevents timezone shifts when parsing dates
 */
export function parseLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date using local timezone components to avoid UTC conversion
  return new Date(year, month - 1, day);
}

/**
 * Check if two dates are the same day in the user's local timezone
 */
export function isSameLocalDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseLocalDateString(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseLocalDateString(date2) : date2;
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Get a date string for N days ago in local timezone
 */
export function getDaysAgoDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getLocalDateString(date);
}

/**
 * Format a date for display in the user's locale
 */
export function formatDisplayDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? parseLocalDateString(date) : date;
  return d.toLocaleDateString(undefined, options);
}

/**
 * Debug helper to log timezone information
 */
export function logTimezoneDebug(context: string, date: Date = new Date()): void {
  console.log(`🕐 Timezone Debug [${context}]:`, {
    localString: date.toString(),
    isoString: date.toISOString(),
    localDateString: getLocalDateString(date),
    timezoneOffset: date.getTimezoneOffset(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}