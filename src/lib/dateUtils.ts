import { parseISO } from 'date-fns';

/**
 * Parse date string without timezone shift.
 * This prevents the date from being shifted by one day when the browser
 * interprets a YYYY-MM-DD string as UTC midnight.
 */
export const parseDateWithoutTimezone = (dateString: string): Date => {
  // If it's a full ISO string with time, use parseISO
  if (dateString.includes('T')) {
    return parseISO(dateString);
  }
  // For date-only strings (YYYY-MM-DD), parse manually to avoid UTC interpretation
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};
