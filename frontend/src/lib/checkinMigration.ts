/**
 * Migration utility to handle check-ins that might have been saved with different date formats
 * This ensures backward compatibility with existing data
 */

import { getLocalDateString } from './dateUtils';

/**
 * Check if a date string represents today in the user's local timezone
 * Handles various date formats that might exist in the database
 */
export function isCheckinToday(checkinDateString: string): boolean {
  if (!checkinDateString) return false;
  
  const todayLocal = getLocalDateString();
  
  // First, check if it's already in YYYY-MM-DD format and matches today
  if (checkinDateString === todayLocal) {
    return true;
  }
  
  // If it's in YYYY-MM-DD format but doesn't match today, it's not today
  if (/^\d{4}-\d{2}-\d{2}$/.test(checkinDateString)) {
    return false;
  }
  
  // Handle ISO date strings (e.g., "2025-07-30T12:34:56.789Z")
  if (checkinDateString.includes('T')) {
    const checkinDate = new Date(checkinDateString);
    const checkinLocal = getLocalDateString(checkinDate);
    return checkinLocal === todayLocal;
  }
  
  // Handle other date formats with timezone info
  try {
    const checkinDate = new Date(checkinDateString);
    if (!isNaN(checkinDate.getTime())) {
      const checkinLocal = getLocalDateString(checkinDate);
      return checkinLocal === todayLocal;
    }
  } catch (e) {
    console.warn('Could not parse check-in date:', checkinDateString);
  }
  
  return false;
}

/**
 * Normalize a check-in date to YYYY-MM-DD format in the user's local timezone
 */
export function normalizeCheckinDate(dateInput: string | Date): string {
  if (!dateInput) return '';
  
  if (typeof dateInput === 'string') {
    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    
    // Parse and convert
    try {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return getLocalDateString(date);
      }
    } catch (e) {
      console.warn('Could not normalize date:', dateInput);
    }
  } else if (dateInput instanceof Date) {
    return getLocalDateString(dateInput);
  }
  
  return '';
}

/**
 * Debug helper to check date consistency across the app
 */
export function debugCheckinDates(checkins: any[]): void {
  console.log('🗓️ Check-in Date Debug:');
  const today = getLocalDateString();
  
  checkins.forEach((checkin, index) => {
    const dateField = checkin.date_submitted || checkin.fields?.date_submitted;
    const normalized = normalizeCheckinDate(dateField);
    const isToday = isCheckinToday(dateField);
    
    console.log(`Check-in ${index + 1}:`, {
      original: dateField,
      normalized: normalized,
      isToday: isToday,
      todayString: today
    });
  });
}