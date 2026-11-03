/**
 * Date and Time Formatting Utilities for SE PAY
 * Provides consistent date and time formatting throughout the app,
 * with support for Australia/Sydney server timestamp conversions to user local timezone.
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
 * Server Primary Timezone (Australia/Sydney)
 */
export const SYDNEY_TIMEZONE = 'Australia/Sydney';

/**
 * India Standard Time (IST - Asia/Kolkata, UTC+05:30)
 */
export const INDIA_TIMEZONE = 'Asia/Kolkata';

/**
 * Calculates a true UTC Date from Sydney local date/time components.
 * Automatically accounts for Australian Daylight Saving Time (AEDT UTC+11 vs AEST UTC+10).
 */
function calculateSydneyUtcDate(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
  s: number
): Date | null {
  const guessEpoch = Date.UTC(y, m - 1, d, h, min, s);

  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: SYDNEY_TIMEZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = dtf.formatToParts(new Date(guessEpoch));
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value;

    let sHour = parseInt(getPart('hour') || '0', 10);
    if (sHour === 24) sHour = 0;

    const sydneyEpoch = Date.UTC(
      parseInt(getPart('year') || String(y), 10),
      parseInt(getPart('month') || String(m), 10) - 1,
      parseInt(getPart('day') || String(d), 10),
      sHour,
      parseInt(getPart('minute') || String(min), 10),
      parseInt(getPart('second') || String(s), 10)
    );

    const offset = sydneyEpoch - guessEpoch;
    const actualUtc = new Date(guessEpoch - offset);
    return isNaN(actualUtc.getTime()) ? null : actualUtc;
  } catch {
    // Fallback: Default to AEDT (UTC+11)
    const fallback = new Date(guessEpoch - 11 * 3600 * 1000);
    return isNaN(fallback.getTime()) ? null : fallback;
  }
}

/**
 * Parses a date or timestamp known to originate in Australia/Sydney timezone
 * (e.g. start_at, end_at, session_date), converting it to a standard JS Date object.
 */
export function parseSydneyDate(
  input: string | number | Date | null | undefined
): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(input).trim();
  if (!str) return null;

  // If already ends with an explicit UTC or timezone offset (e.g. Z, +11:00, -05:00)
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Check for full date or date+time string: YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
  const match = str.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );

  if (!match) {
    // Check if it's a time-only string like "10:26 PM" or "22:26:53"
    const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = parseInt(timeMatch[2], 10);
      const s = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      const ampm = timeMatch[4]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;

      // Anchor to current day in Sydney
      const now = new Date();
      let sy = 2026;
      let sm = 10;
      let sd = 29;
      try {
        const dtfDate = new Intl.DateTimeFormat('en-US', {
          timeZone: SYDNEY_TIMEZONE,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        });
        const parts = dtfDate.formatToParts(now);
        const getPart = (t: string) => parts.find((p) => p.type === t)?.value;
        sy = parseInt(getPart('year') || '2026', 10);
        sm = parseInt(getPart('month') || '10', 10);
        sd = parseInt(getPart('day') || '29', 10);
      } catch {
        sy = now.getFullYear();
        sm = now.getMonth() + 1;
        sd = now.getDate();
      }

      return calculateSydneyUtcDate(sy, sm, sd, h, m, s);
    }

    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  const h = match[4] ? parseInt(match[4], 10) : 0;
  const min = match[5] ? parseInt(match[5], 10) : 0;
  const s = match[6] ? parseInt(match[6], 10) : 0;

  return calculateSydneyUtcDate(y, m, d, h, min, s);
}

/**
 * Formats an Australia/Sydney timestamp (e.g. start_at, end_at) to the user's local time:
 * e.g. "4:56 PM" or "10:26 PM" (based on device/user timezone).
 */
export function formatSydneyToUserTime(
  input: string | number | Date | null | undefined
): string {
  const date = parseSydneyDate(input);
  if (!date) return '';

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Formats an Australia/Sydney timestamp to user's local date: "29 Oct 2026"
 */
export function formatSydneyToUserDate(
  input: string | number | Date | null | undefined
): string {
  const date = parseSydneyDate(input);
  if (!date) return '';

  const day = date.getDate();
  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formats an Australia/Sydney timestamp to user's local date & time: "29 Oct 2026, 4:56 PM"
 */
export function formatSydneyToUserDateTime(
  input: string | number | Date | null | undefined
): string {
  const date = parseSydneyDate(input);
  if (!date) return '';

  const dateStr = formatSydneyToUserDate(date);
  const timeStr = formatSydneyToUserTime(date);

  return dateStr && timeStr ? `${dateStr}, ${timeStr}` : dateStr || timeStr;
}

/**
 * Formats a shift time range from Sydney start_at and end_at to user's local timezone:
 * e.g. "4:51 PM – 4:53 PM" (or "29 Oct 4:51 PM – 30 Oct 1:15 AM" if cross-day)
 */
export function formatSydneyShiftRange(
  startInput: string | number | Date | null | undefined,
  endInput: string | number | Date | null | undefined
): string {
  const startDate = parseSydneyDate(startInput);
  const endDate = parseSydneyDate(endInput);

  if (!startDate && !endDate) return '';
  if (startDate && !endDate) return formatSydneyToUserTime(startDate);
  if (!startDate && endDate) return formatSydneyToUserTime(endDate);

  const startFormatted = formatSydneyToUserTime(startDate);
  const endFormatted = formatSydneyToUserTime(endDate);

  if (
    startDate!.getFullYear() !== endDate!.getFullYear() ||
    startDate!.getMonth() !== endDate!.getMonth() ||
    startDate!.getDate() !== endDate!.getDate()
  ) {
    const startDateText = formatSydneyToUserDate(startDate);
    const endDateText = formatSydneyToUserDate(endDate);
    return `${startDateText} ${startFormatted} – ${endDateText} ${endFormatted}`;
  }

  return `${startFormatted} – ${endFormatted}`;
}

/**
 * Formats a shift's Sydney timestamps (start_at, end_at, time_range) into the user's local timezone.
 * Returns formatted date text (e.g. "31 Oct 2026") and time range (e.g. "2:43 PM – 2:46 PM").
 */
export function formatShiftRecordTime(record: {
  start_at?: string | null;
  end_at?: string | null;
  time_range?: string | null;
  session_date?: string | null;
}): { dateText: string; timeRangeText: string } {
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (record.start_at) {
    startDate = parseSydneyDate(record.start_at);
  }
  if (record.end_at) {
    endDate = parseSydneyDate(record.end_at);
  }

  // If start_at or end_at are missing, try to parse from time_range (e.g. "2026-10-31 20:13:42 - 2026-10-31 20:16:36")
  if ((!startDate || !endDate) && record.time_range) {
    const parts = record.time_range.split(' - ');
    if (parts[0] && !startDate) {
      startDate = parseSydneyDate(parts[0].trim());
    }
    if (parts[1] && !endDate) {
      endDate = parseSydneyDate(parts[1].trim());
    }
  }

  const dateText = startDate
    ? formatSydneyToUserDate(startDate)
    : record.session_date
    ? formatSydneyToUserDate(record.session_date)
    : '--';

  let timeRangeText = '--';
  if (startDate && endDate) {
    timeRangeText = formatSydneyShiftRange(startDate, endDate);
  } else if (startDate) {
    timeRangeText = formatSydneyToUserTime(startDate);
  } else if (record.time_range) {
    timeRangeText = record.time_range;
  }

  return { dateText, timeRangeText };
}

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
 * Formats an Australia/Sydney timestamp into standard submitted format:
 * e.g. "31 Oct 2026 6.40pm" (in user device local timezone)
 */
export function formatSydneySubmittedDate(
  input: string | number | Date | null | undefined
): string {
  const date = parseSydneyDate(input);
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
 * Formats an Australia/Sydney timestamp explicitly into UTC:
 * e.g. "31 Oct 2026 1.10pm UTC"
 */
export function formatSydneyToUtcDateTime(
  input: string | number | Date | null | undefined,
  includeSuffix = false
): string {
  const date = parseSydneyDate(input);
  if (!date) return '';

  const day = date.getUTCDate();
  const month = MONTH_NAMES_SHORT[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} ${year} ${hours}.${minutes}${ampm}${includeSuffix ? ' UTC' : ''}`;
}

/**
 * Formats a date portion only in UTC from Sydney date: "31 Oct 2026"
 */
export function formatSydneyToUtcDate(
  input: string | number | Date | null | undefined
): string {
  const date = parseSydneyDate(input);
  if (!date) return '';

  const day = date.getUTCDate();
  const month = MONTH_NAMES_SHORT[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day} ${month} ${year}`;
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

/**
 * Formats a Date object to YYYY-MM-DD string
 */
export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD string to a Date object
 */
export function parseYMDToDate(ymd: string): Date | null {
  if (!ymd) return null;
  const parts = ymd.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats YYYY-MM-DD to display string: e.g. "02 Nov 2026"
 */
export function formatYMDToDisplay(ymd: string): string {
  const date = parseYMDToDate(ymd);
  if (!date) return ymd;
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats date range for display e.g. "02 Nov 2026" or "26 Oct – 02 Nov 2026" or "All Dates"
 */
export function formatDateRangeDisplay(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  if (!startDate && !endDate) return 'All Dates';
  if (startDate && !endDate) return `From ${formatYMDToDisplay(startDate)}`;
  if (!startDate && endDate) return `Up to ${formatYMDToDisplay(endDate)}`;
  if (startDate === endDate) return formatYMDToDisplay(startDate!);
  return `${formatYMDToDisplay(startDate!)} – ${formatYMDToDisplay(endDate!)}`;
}

export function getTodayYMD(): string {
  return formatDateToYMD(new Date());
}

export function getYesterdayYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToYMD(d);
}

export function getLast7DaysYMD(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    startDate: formatDateToYMD(start),
    endDate: formatDateToYMD(end),
  };
}

export function getThisMonthYMD(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
  return {
    startDate: formatDateToYMD(start),
    endDate: formatDateToYMD(end),
  };
}

/**
 * Formats an Australia/Sydney timestamp into India Standard Time (IST - Asia/Kolkata):
 * e.g. "03 Nov 2026, 11:04 AM" or "03 Nov 2026, 11:04:29 AM"
 */
export function formatSydneyToIndiaDateTime(
  input: string | number | Date | null | undefined,
  options: { includeSeconds?: boolean; hour12?: boolean } = {}
): string {
  const date = parseSydneyDate(input);
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: INDIA_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: options.includeSeconds ? '2-digit' : undefined,
      hour12: options.hour12 !== false,
    }).format(date);
  } catch {
    return formatSydneyToUserDateTime(date);
  }
}

/**
 * Formats an Australia/Sydney timestamp into India Standard Time date:
 * e.g. "03 Nov 2026"
 */
export function formatSydneyToIndiaDate(
  input: string | number | Date | null | undefined
): string {
  const date = parseSydneyDate(input);
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: INDIA_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  } catch {
    return formatSydneyToUserDate(date);
  }
}

/**
 * Formats an Australia/Sydney timestamp into India Standard Time time:
 * e.g. "11:04 AM" or "11:04:29 AM"
 */
export function formatSydneyToIndiaTime(
  input: string | number | Date | null | undefined,
  options: { includeSeconds?: boolean; hour12?: boolean } = {}
): string {
  const date = parseSydneyDate(input);
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: INDIA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: options.includeSeconds ? '2-digit' : undefined,
      hour12: options.hour12 !== false,
    }).format(date);
  } catch {
    return formatSydneyToUserTime(date);
  }
}

/**
 * Converts an Australia/Sydney timestamp into detailed India Standard Time information.
 */
export function convertSydneyToIndia(
  input: string | number | Date | null | undefined
): {
  sydneyTime: string;
  indiaDateTime: string;
  indiaDate: string;
  indiaTime: string;
  standard24: string;
  utcDate: Date;
} | null {
  const utcDate = parseSydneyDate(input);
  if (!utcDate) return null;

  try {
    const indiaDateTime = formatSydneyToIndiaDateTime(utcDate, { includeSeconds: true });
    const indiaDate = formatSydneyToIndiaDate(utcDate);
    const indiaTime = formatSydneyToIndiaTime(utcDate, { includeSeconds: true });

    const dtf24 = new Intl.DateTimeFormat('en-IN', {
      timeZone: INDIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = dtf24.formatToParts(utcDate);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value;
    const standard24 = `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;

    return {
      sydneyTime: typeof input === 'string' ? input : String(input ?? ''),
      indiaDateTime,
      indiaDate,
      indiaTime,
      standard24,
      utcDate,
    };
  } catch {
    return null;
  }
}

