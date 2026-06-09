import { toGregorian, toJalaali, jalaaliMonthLength, isValidJalaaliDate } from "jalaali-js";

const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

/** Parse API gregorian ISO date (YYYY-MM-DD) to Jalali parts. */
export function gregorianISOToJalali(iso) {
  if (!iso || typeof iso !== "string") return { year: "", month: "", day: "" };
  const [gy, gm, gd] = iso.split("-").map(Number);
  if (!gy || !gm || !gd) return { year: "", month: "", day: "" };
  const { jy, jm, jd } = toJalaali(gy, gm, gd);
  return { year: String(jy), month: String(jm), day: String(jd) };
}

/** Convert Jalali parts to gregorian ISO for API. Returns empty string if invalid. */
export function jalaliToGregorianISO(year, month, day) {
  const jy = Number(year);
  const jm = Number(month);
  const jd = Number(day);
  if (!jy || !jm || !jd || !isValidJalaaliDate(jy, jm, jd)) return "";
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

export function getJalaliMonthLength(year, month) {
  const jy = Number(year);
  const jm = Number(month);
  if (!jy || !jm) return 31;
  return jalaaliMonthLength(jy, jm);
}

export function getJalaliYearOptions(minYear = 1300, maxYear = 1405) {
  const years = [];
  for (let y = maxYear; y >= minYear; y -= 1) years.push(y);
  return years;
}

export { JALALI_MONTHS };
