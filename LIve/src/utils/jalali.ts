/**
 * Persian (Jalali) Calendar Utility Module
 * Complete, modern, and reliable date handling using dayjs + jalaliday
 * 
 * Strategy: Display → Jalali, Store → Gregorian
 */

import dayjs from 'dayjs';
import jalali from 'jalaliday';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend dayjs with plugins
dayjs.extend(jalali);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Set default timezone to Iran
const IRAN_TIMEZONE = 'Asia/Tehran';

/**
 * Fix UTC dates to Iran timezone
 * This ensures dates from server (usually UTC) are displayed correctly
 */
export function fixUTCToIran(date: Date | string | null | undefined): Date {
  if (!date) return new Date();
  
  const dt = typeof date === 'string' ? new Date(date) : date;
  return dayjs(dt).tz(IRAN_TIMEZONE).toDate();
}

/**
 * Convert Gregorian date to Jalali date string
 * @param date - Date object or ISO string
 * @param format - Optional format string (default: 'YYYY/MM/DD')
 * @returns Jalali date string
 */
export function toJalali(
  date: Date | string | null | undefined,
  format: string = 'YYYY/MM/DD'
): string {
  if (!date) return '';
  
  try {
    const dt = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dt.getTime())) return '';
    
    const fixedDate = fixUTCToIran(dt);
    return dayjs(fixedDate)
      .calendar('jalali')
      .format(format);
  } catch (error) {
    console.error('[jalali.ts] Error converting to Jalali:', error);
    return '';
  }
}

/**
 * Convert Jalali date to Gregorian Date object
 * @param jy - Jalali year
 * @param jm - Jalali month (1-12)
 * @param jd - Jalali day
 * @param hour - Hour (0-23), optional
 * @param minute - Minute (0-59), optional
 * @returns Gregorian Date object
 */
export function toGregorian(
  jy: number,
  jm: number,
  jd: number,
  hour: number = 0,
  minute: number = 0
): Date {
  try {
    const jalaliDate = dayjs()
      .calendar('jalali')
      .year(jy)
      .month(jm - 1) // jalaliday uses 0-indexed months
      .date(jd)
      .hour(hour)
      .minute(minute)
      .second(0)
      .millisecond(0);
    
    return jalaliDate.toDate();
  } catch (error) {
    console.error('[jalali.ts] Error converting to Gregorian:', error);
    return new Date();
  }
}

/**
 * Format Jalali date with custom format
 * @param date - Date object
 * @param format - Format string (e.g., 'YYYY/MM/DD HH:mm', 'dddd DD MMMM YYYY')
 * @returns Formatted Jalali date string
 */
export function formatJalali(date: Date | string | null | undefined, format: string): string {
  if (!date) return '';
  
  try {
    const dt = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dt.getTime())) return '';
    
    const fixedDate = fixUTCToIran(dt);
    return dayjs(fixedDate)
      .calendar('jalali')
      .format(format);
  } catch (error) {
    console.error('[jalali.ts] Error formatting Jalali:', error);
    return '';
  }
}

/**
 * Get current Jalali date string
 * @param format - Optional format string (default: 'YYYY/MM/DD HH:mm:ss')
 * @returns Current Jalali date string
 */
export function nowJalali(format: string = 'YYYY/MM/DD HH:mm:ss'): string {
  return dayjs()
    .tz(IRAN_TIMEZONE)
    .calendar('jalali')
    .format(format);
}

/**
 * Parse Jalali date input string to Gregorian Date
 * Supports formats: 'YYYY/MM/DD', 'YYYY-MM-DD', 'YYYY/MM/DD HH:mm'
 * @param input - Jalali date string
 * @returns Date object or null if invalid
 */
export function parseJalaliInput(input: string): Date | null {
  if (!input || input.trim() === '') return null;
  
  try {
    // Try parsing as Jalali date
    const cleaned = input.trim();
    
    // Support multiple formats
    const formats = [
      'YYYY/MM/DD HH:mm:ss',
      'YYYY/MM/DD HH:mm',
      'YYYY/MM/DD',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD',
    ];
    
    let parsed: dayjs.Dayjs | null = null;
    
    for (const fmt of formats) {
      parsed = dayjs(cleaned, fmt, 'jalali', true);
      if (parsed.isValid()) break;
    }
    
    if (!parsed || !parsed.isValid()) {
      return null;
    }
    
    return parsed.toDate();
  } catch (error) {
    console.error('[jalali.ts] Error parsing Jalali input:', error);
    return null;
  }
}

/**
 * Get Jalali date object with year, month, day
 */
export function getJalaliDate(date: Date | string | null | undefined): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!date) return null;
  
  try {
    const dt = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dt.getTime())) return null;
    
    const fixedDate = fixUTCToIran(dt);
    const jalaliDate = dayjs(fixedDate).calendar('jalali');
    
    return {
      year: jalaliDate.year(),
      month: jalaliDate.month() + 1, // Convert to 1-indexed
      day: jalaliDate.date(),
    };
  } catch (error) {
    console.error('[jalali.ts] Error getting Jalali date:', error);
    return null;
  }
}

/**
 * Get Jalali month name
 */
export function getJalaliMonthName(month: number): string {
  const months = [
    '', // 0 index
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];
  
  return months[month] || '';
}

/**
 * Get Jalali day name
 */
export function getJalaliDayName(date: Date | string): string {
  const days = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنج‌شنبه',
    'جمعه',
    'شنبه',
  ];
  
  try {
    const dt = typeof date === 'string' ? new Date(date) : date;
    const fixedDate = fixUTCToIran(dt);
    const jalaliDate = dayjs(fixedDate).calendar('jalali');
    const dayIndex = jalaliDate.day();
    return days[dayIndex] || '';
  } catch {
    return '';
  }
}

/**
 * Convert English digits to Persian digits
 */
export function toPersianDigits(str: string | number): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(str).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

// Ensure toPersianDigits is available globally to prevent tree-shaking issues
// This is a workaround for production builds where the function might be tree-shaken
if (typeof window !== 'undefined') {
  (window as any).__toPersianDigits = toPersianDigits;
}

/**
 * Convert Persian digits to English digits
 */
export function toEnglishDigits(str: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return str.replace(/[۰-۹]/g, (char) => {
    const index = persianDigits.indexOf(char);
    return index !== -1 ? String(index) : char;
  });
}

/**
 * Check if a Jalali year is a leap year
 */
export function isJalaliLeapYear(year: number): boolean {
  // Jalali leap year calculation
  const a = (year + 2346) % 128;
  return a < 29 && (a % 4 === 0);
}

/**
 * Get number of days in a Jalali month
 */
export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) {
    return 31;
  } else if (month <= 11) {
    return 30;
  } else {
    // Month 12 (Esfand)
    return isJalaliLeapYear(year) ? 30 : 29;
  }
}

/**
 * Alias for toGregorian - for backward compatibility
 * Converts Persian (Jalali) date to Gregorian Date object
 */
export function persianToGregorian(jy: number, jm: number, jd: number, hour?: number, minute?: number): Date {
  return toGregorian(jy, jm, jd, hour, minute);
}
