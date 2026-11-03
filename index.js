/**
 * Australia/Sydney to India (IST - Asia/Kolkata) Time Converter
 * 
 * Accurately converts Australia/Sydney server timestamps (accounting for Australian
 * Daylight Saving Time: AEDT UTC+11 / AEST UTC+10) to India Standard Time (IST UTC+05:30).
 */

const SYDNEY_TIMEZONE = 'Australia/Sydney';
const INDIA_TIMEZONE = 'Asia/Kolkata';

/**
 * Calculates a true UTC Date from Sydney local date/time components.
 * Automatically accounts for Australian Daylight Saving Time (AEDT vs AEST).
 *
 * @param {number} y - Year (e.g. 2026)
 * @param {number} m - Month (1-12)
 * @param {number} d - Day (1-31)
 * @param {number} h - Hours (0-23)
 * @param {number} min - Minutes (0-59)
 * @param {number} s - Seconds (0-59)
 * @returns {Date|null}
 */
function calculateSydneyUtcDate(y, m, d, h = 0, min = 0, s = 0) {
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
    const getPart = (type) => parts.find((p) => p.type === type)?.value;

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
 * Parses an Australia/Sydney date/time input into a UTC JavaScript Date object.
 * 
 * Supports:
 * - String: "2026-11-03 16:34:29", "2026-11-03T16:34:29", "2026-11-03"
 * - Object: { transaction_date: "2026-11-03 16:34:29" }
 * - Timestamp number or existing Date object
 *
 * @param {string|object|number|Date} input
 * @returns {Date|null}
 */
function parseSydneyDate(input) {
  if (!input) return null;

  // Extract date string if an object was passed (e.g. API transaction payload)
  if (typeof input === 'object' && !(input instanceof Date)) {
    input = input.transaction_date || input.date || input.created_at || input.session_date;
    if (!input) return null;
  }

  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(input).trim();
  if (!str) return null;

  // If the string already contains an explicit offset (e.g. Z or +11:00)
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Parse YYYY-MM-DD HH:mm:ss or YYYY-MM-DDTHH:mm:ss
  const match = str.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );

  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const d = parseInt(match[3], 10);
    const h = match[4] ? parseInt(match[4], 10) : 0;
    const min = match[5] ? parseInt(match[5], 10) : 0;
    const s = match[6] ? parseInt(match[6], 10) : 0;

    return calculateSydneyUtcDate(y, m, d, h, min, s);
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Converts Australia/Sydney time to India Time (IST - Asia/Kolkata).
 * 
 * @param {string|object|number|Date} sydneyInput - e.g. "2026-11-03 16:34:29" or { transaction_date: "..." }
 * @param {object} [options]
 * @param {boolean} [options.includeSeconds=true]
 * @param {boolean} [options.hour12=true]
 * @returns {{
 *   sydneyTime: string,
 *   indiaDateTime: string,
 *   indiaDate: string,
 *   indiaTime: string,
 *   standard24: string,
 *   utcDate: Date
 * } | null}
 */
function convertSydneyToIndia(sydneyInput, options = {}) {
  const utcDate = parseSydneyDate(sydneyInput);
  if (!utcDate) return null;

  const includeSeconds = options.includeSeconds !== false;
  const hour12 = options.hour12 !== false;

  // 1. Formatted 12-hour Date & Time: "03 Nov 2026, 11:04:29 AM"
  const dtfFull = new Intl.DateTimeFormat('en-IN', {
    timeZone: INDIA_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: hour12,
  });

  // 2. Date only in India: "03 Nov 2026"
  const dtfDate = new Intl.DateTimeFormat('en-IN', {
    timeZone: INDIA_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

  // 3. Time only in India: "11:04:29 AM"
  const dtfTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: INDIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: hour12,
  });

  // 4. Standard 24-hour YYYY-MM-DD HH:mm:ss format
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
  const getPart = (type) => parts.find((p) => p.type === type)?.value;
  const standard24 = `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;

  const rawInput =
    typeof sydneyInput === 'object' && !(sydneyInput instanceof Date)
      ? sydneyInput.transaction_date || JSON.stringify(sydneyInput)
      : String(sydneyInput);

  return {
    sydneyTime: rawInput,
    indiaDateTime: dtfFull.format(utcDate),
    indiaDate: dtfDate.format(utcDate),
    indiaTime: dtfTime.format(utcDate),
    standard24: standard24,
    utcDate: utcDate,
  };
}

/**
 * Convenient helper to get a formatted India time string directly:
 * e.g. "03 Nov 2026, 11:04 AM" or "11:04 AM"
 *
 * @param {string|object|number|Date} sydneyInput
 * @param {'datetime'|'date'|'time'|'standard24'} [format='datetime']
 * @returns {string}
 */
function getIndiaTime(sydneyInput, format = 'datetime') {
  const result = convertSydneyToIndia(sydneyInput);
  if (!result) return '';

  switch (format) {
    case 'date':
      return result.indiaDate;
    case 'time':
      return result.indiaTime;
    case 'standard24':
      return result.standard24;
    case 'datetime':
    default:
      return result.indiaDateTime;
  }
}

// -------------------------------------------------------------
// Demonstration / Test with your transaction_date:
// -------------------------------------------------------------
const payload = {
  "transaction_date": "2026-11-03 16:46:24"
};

console.log('--- Sydney to India Time Conversion ---');
console.log('Input (Sydney AEDT):', payload.transaction_date);

const converted = convertSydneyToIndia(payload);
console.log('\nConverted Result:');
console.log('India Date & Time :', converted.indiaDateTime);
console.log('India Date Only   :', converted.indiaDate);
console.log('India Time Only   :', converted.indiaTime);
console.log('Standard 24-hr    :', converted.standard24);
console.log('UTC ISO String    :', converted.utcDate.toISOString());

// Module exports for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    convertSydneyToIndia,
    getIndiaTime,
    parseSydneyDate,
    calculateSydneyUtcDate,
    SYDNEY_TIMEZONE,
    INDIA_TIMEZONE,
  };
}
