// Persian (Jalali) calendar conversion utilities
// Based on accurate algorithm for Persian calendar conversion

export interface PersianDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Converts a Gregorian date to Persian (Jalali) date
 * Using accurate algorithm for Persian calendar conversion
 */
export function toPersian(date: Date): PersianDate {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1; // JavaScript months are 0-indexed
  const gd = date.getDate();

  // Calculate Julian Day Number
  let gDayNo: number;
  let adjustedGy = gy;
  let adjustedGm = gm;

  if (adjustedGm <= 2) {
    adjustedGy--;
    adjustedGm += 12;
  }

  gDayNo = (365 * adjustedGy) + Math.floor(adjustedGy / 4) - Math.floor(adjustedGy / 100) + 
           Math.floor(adjustedGy / 400) + Math.floor((306 * (adjustedGm + 1)) / 10) - 31 + gd;

  // Persian epoch: 226894 (March 22, 622 AD)
  const jDayNo = gDayNo - 226894;

  // Calculate Persian year
  let jy = Math.floor((33 * jDayNo + 3) / 12053);
  let remainingDays = jDayNo - Math.floor((12053 * jy + 3) / 33);

  // Calculate Persian month
  let jm: number;
  let jd: number;

  if (remainingDays < 186) {
    jm = 1 + Math.floor(remainingDays / 31);
    jd = 1 + (remainingDays % 31);
  } else {
    jm = 7 + Math.floor((remainingDays - 186) / 30);
    jd = 1 + ((remainingDays - 186) % 30);
  }

  jy += 621;

  return {
    year: jy,
    month: jm,
    day: jd,
  };
}

/**
 * Formats a Persian date as string (YYYY/MM/DD)
 */
export function formatPersianDate(date: Date): string {
  const p = toPersian(date);
  return `${p.year}/${String(p.month).padStart(2, '0')}/${String(p.day).padStart(2, '0')}`;
}

/**
 * Gets Persian day name (شنبه, یکشنبه, etc.)
 * Persian week starts from Saturday (شنبه)
 */
export function getPersianDayName(date: Date): string {
  const weekday = date.getDay(); // 0 = Sunday, 6 = Saturday
  const persianDays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];

  // Convert: Sat(6)->6, Sun(0)->0, Mon(1)->1, Tue(2)->2, Wed(3)->3, Thu(4)->4, Fri(5)->5
  let index: number;
  if (weekday === 6) { // Saturday
    index = 6;
  } else if (weekday === 0) { // Sunday
    index = 0;
  } else {
    index = weekday;
  }

  return persianDays[index];
}

/**
 * Gets Persian month name (فروردین, اردیبهشت, etc.)
 */
export function getPersianMonthName(month: number): string {
  const persianMonths = [
    "", // 0 index (months are 1-12)
    "فروردین", "اردیبهشت", "خرداد",
    "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر",
    "دی", "بهمن", "اسفند",
  ];
  if (month >= 1 && month <= 12) {
    return persianMonths[month];
  }
  return "";
}

/**
 * Converts Persian date to Gregorian date
 * This is needed for querying data by Persian month/year
 */
export function persianToGregorian(persianYear: number, persianMonth: number, persianDay: number): Date {
  // Calculate Julian Day Number from Persian date
  const jy = persianYear - 621;
  let jDayNo = Math.floor((12053 * jy + 3) / 33);

  let remainingDays: number;
  if (persianMonth <= 6) {
    remainingDays = (persianMonth - 1) * 31 + (persianDay - 1);
  } else {
    remainingDays = 186 + (persianMonth - 7) * 30 + (persianDay - 1);
  }

  jDayNo += remainingDays;

  // Convert to Gregorian
  const gDayNo = jDayNo + 226894;

  // Calculate Gregorian year
  let gy = Math.floor((400 * gDayNo - 1) / 146097);
  let gDayNoInYear = gDayNo - Math.floor(146097 * gy / 400);

  if (gDayNoInYear === 0) {
    gy--;
    gDayNoInYear = 365;
  }

  let gm: number;
  let gd: number;

  if (gDayNoInYear <= 365) {
    if (gDayNoInYear <= 31) {
      gm = 1;
      gd = gDayNoInYear;
    } else if (gDayNoInYear <= 59) {
      gm = 2;
      gd = gDayNoInYear - 31;
    } else if (gDayNoInYear <= 90) {
      gm = 3;
      gd = gDayNoInYear - 59;
    } else if (gDayNoInYear <= 120) {
      gm = 4;
      gd = gDayNoInYear - 90;
    } else if (gDayNoInYear <= 151) {
      gm = 5;
      gd = gDayNoInYear - 120;
    } else if (gDayNoInYear <= 181) {
      gm = 6;
      gd = gDayNoInYear - 151;
    } else if (gDayNoInYear <= 212) {
      gm = 7;
      gd = gDayNoInYear - 181;
    } else if (gDayNoInYear <= 243) {
      gm = 8;
      gd = gDayNoInYear - 212;
    } else if (gDayNoInYear <= 273) {
      gm = 9;
      gd = gDayNoInYear - 243;
    } else if (gDayNoInYear <= 304) {
      gm = 10;
      gd = gDayNoInYear - 273;
    } else if (gDayNoInYear <= 334) {
      gm = 11;
      gd = gDayNoInYear - 304;
    } else {
      gm = 12;
      gd = gDayNoInYear - 334;
    }
  } else {
    // Leap year
    if (gDayNoInYear <= 366) {
      if (gDayNoInYear <= 31) {
        gm = 1;
        gd = gDayNoInYear;
      } else if (gDayNoInYear <= 60) {
        gm = 2;
        gd = gDayNoInYear - 31;
      } else if (gDayNoInYear <= 91) {
        gm = 3;
        gd = gDayNoInYear - 60;
      } else if (gDayNoInYear <= 121) {
        gm = 4;
        gd = gDayNoInYear - 91;
      } else if (gDayNoInYear <= 152) {
        gm = 5;
        gd = gDayNoInYear - 121;
      } else if (gDayNoInYear <= 182) {
        gm = 6;
        gd = gDayNoInYear - 152;
      } else if (gDayNoInYear <= 213) {
        gm = 7;
        gd = gDayNoInYear - 182;
      } else if (gDayNoInYear <= 244) {
        gm = 8;
        gd = gDayNoInYear - 213;
      } else if (gDayNoInYear <= 274) {
        gm = 9;
        gd = gDayNoInYear - 244;
      } else if (gDayNoInYear <= 305) {
        gm = 10;
        gd = gDayNoInYear - 274;
      } else if (gDayNoInYear <= 335) {
        gm = 11;
        gd = gDayNoInYear - 305;
      } else {
        gm = 12;
        gd = gDayNoInYear - 335;
      }
    }
  }

  // Create Date object (JavaScript months are 0-indexed)
  return new Date(gy, gm - 1, gd);
}

/**
 * Gets the first day of a Persian month as Gregorian date
 */
export function getFirstDayOfPersianMonth(persianYear: number, persianMonth: number): Date {
  return persianToGregorian(persianYear, persianMonth, 1);
}

/**
 * Gets the last day of a Persian month as Gregorian date
 */
export function getLastDayOfPersianMonth(persianYear: number, persianMonth: number): Date {
  // Persian months have 30 days (except month 12 which has 29 or 30)
  const lastDay = persianMonth === 12 ? 29 : 30; // Simplified - should check for leap year
  return persianToGregorian(persianYear, persianMonth, lastDay);
}

