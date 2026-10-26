/**
 * Date and Time Formatting Utilities for SE PAY
 * Provides consistent date and time formatting throughout the app.
 */

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Safely parses various date formats (ISO string, SQL "YYYY-MM-DD HH:mm:ss", timestamp number, or Date object)
 */
export function parseDate(
  input: string | number | Date | null | undefined
): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Convert SQL format "YYYY-MM-DD HH:mm:ss" to ISO "YYYY-MM-DDTHH:mm:ss"
    const isoString =
      trimmed.includes(' ') && !trimmed.includes('T')
        ? trimmed.replace(' ', 'T')
        : trimmed;

    const parsed = new Date(isoString);
    if (!isNaN(parsed.getTime())) return parsed;

    // Fallback regex parser for manual year/month/day
    const match = trimmed.match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
    );
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const hour = match[4] ? parseInt(match[4], 10) : 0;
      const min = match[5] ? parseInt(match[5], 10) : 0;
      const sec = match[6] ? parseInt(match[6], 10) : 0;
      const fallbackDate = new Date(year, month, day, hour, min, sec);
      return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
    }
  }

  return null;
}

/**
 * Formats a date/timestamp to standard user format: "26 Oct 2026 10.30pm"
 * @param input ISO string, SQL date string, timestamp, or Date
 * @returns e.g. "26 Oct 2026 10.30pm" or empty string if invalid
 */
export function formatDateTime(
  input: string | number | Date | null | undefined
): string {
  const date = parseDate(input);
  if (!date) return '';

  const day = date.getDate();
  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} ${year} ${hours}.${minutes}${ampm}`;
}

/**
 * Alias for formatDateTime, specifically for submission timestamps
 * e.g. "26 Oct 2026 10.30pm"
 */
export const formatSubmittedDate = formatDateTime;

/**
 * Formats date portion only: "26 Oct 2026"
 */
export function formatDate(
  input: string | number | Date | null | undefined
): string {
  const date = parseDate(input);
  if (!date) return '';

  const day = date.getDate();
  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formats time portion only: "10.30pm"
 */
export function formatTime(
  input: string | number | Date | null | undefined
): string {
  const date = parseDate(input);
  if (!date) return '';

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${hours}.${minutes}${ampm}`;
}
