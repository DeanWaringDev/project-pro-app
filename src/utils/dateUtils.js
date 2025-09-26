/**
 * Date utility functions for handling Firestore timestamps and date formatting
 */

// Utility to safely convert Firestore Timestamp, string, or Date to a valid date string
export function safeToDateString(deadline) {
  let date = deadline;
  if (date && typeof date === 'object' && date.toDate) {
    date = date.toDate();
  } else if (date && !(date instanceof Date)) {
    date = new Date(date);
  }
  return date instanceof Date && !isNaN(date) ? date.toDateString() : '';
}

// Utility to convert a Date object to YYYY-MM-DD format using local timezone
export function dateToLocalString(date) {
  if (!date || !(date instanceof Date) || isNaN(date)) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Utility to check if two dates are the same day
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Utility to format date for display
export function formatDateForDisplay(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}