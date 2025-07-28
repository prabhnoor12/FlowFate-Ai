// Utility for parsing and formatting dates (ESM)
import { DateTime } from 'luxon';
import { parseISO, isValid, addDays, subDays, isWithinInterval, formatDistanceToNow, addBusinessDays, subBusinessDays, format as formatDateFns } from 'date-fns';

// Parse a date string (ISO or common formats)
export function parseDate(dateString) {
  if (!dateString) return null;
  let date = parseISO(dateString);
  if (!isValid(date)) {
    date = new Date(dateString);
  }
  return isValid(date) ? date : null;
}

// Format a date to a readable string (with optional timezone)
export function formatDate(date, dateFormat = 'yyyy-MM-dd HH:mm', timeZone = 'UTC') {
  if (!date || !isValid(date)) return '';
  // Use Luxon for timezone-aware formatting
  const dt = typeof date === 'string'
    ? DateTime.fromISO(date, { zone: timeZone })
    : DateTime.fromJSDate(date, { zone: timeZone });
  return dt.isValid ? dt.toFormat(dateFormat) : '';
}

// Add days to a date
export function addDaysToDate(date, days) {
  if (!date || typeof days !== 'number') return null;
  return addDays(date, days);
}

// Subtract days from a date
export function subDaysFromDate(date, days) {
  if (!date || typeof days !== 'number') return null;
  return subDays(date, days);
}

// Convert date to UTC
export function toUtc(date, timeZone = 'UTC') {
  if (!date || !isValid(date)) return null;
  // Use Luxon for timezone conversion
  const dt = typeof date === 'string'
    ? DateTime.fromISO(date, { zone: timeZone })
    : DateTime.fromJSDate(date, { zone: timeZone });
  return dt.isValid ? dt.toUTC().toJSDate() : null;
}

// Check if a date is within a range
export function isDateInRange(date, start, end) {
  if (!date || !start || !end) return false;
  return isWithinInterval(date, { start, end });
}

// Get relative time from now (e.g., '3 days ago', 'in 2 hours')
export function relativeTime(date, options = {}) {
  if (!date || !isValid(date)) return '';
  return formatDistanceToNow(date, { addSuffix: true, ...options });
}

// Add business days to a date
export function addBusinessDaysToDate(date, days) {
  if (!date || typeof days !== 'number') return null;
  return addBusinessDays(date, days);
}

// Subtract business days from a date
export function subBusinessDaysFromDate(date, days) {
  if (!date || typeof days !== 'number') return null;
  return subBusinessDays(date, days);
}

// Locale-aware formatting
export function formatDateLocale(date, dateFormat = 'PPpp', locale) {
  if (!date || !isValid(date)) return '';
  return formatDateFns(date, dateFormat, { locale });
}
