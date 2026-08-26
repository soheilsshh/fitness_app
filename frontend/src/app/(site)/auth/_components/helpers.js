import { toast } from "sonner";

/** Convert Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII 0-9. */
export function toEnglishDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Convert ASCII digits to Persian (۰-۹). */
export function toPersianDigits(value) {
  return String(value ?? "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

/** Keep only digits (Persian/Arabic/English) and return English digit string. */
export function normalizeNumericInput(value, { allowDecimal = false } = {}) {
  let s = toEnglishDigits(value);
  if (allowDecimal) {
    s = s.replace(/[^\d.]/g, "");
    const parts = s.split(".");
    if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("");
    return s;
  }
  return s.replace(/\D/g, "");
}

/** Normalize phone for validation / API (English digits, no spaces/dashes). */
export function normalizeIranPhone(phone) {
  return toEnglishDigits(phone).replace(/[\s\-()]/g, "");
}

export function isValidIranPhone(phone) {
  return /^09\d{9}$/.test(normalizeIranPhone(phone));
}

export function isValidOtp(otp) {
  return /^\d{4,6}$/.test(toEnglishDigits(otp).trim());
}

/** Iranian national ID checksum (کد ملی), matching backend IsValidIranNationalID. */
export function isValidIranNationalID(id) {
  const digits = normalizeNumericInput(id);
  if (digits.length !== 10) return false;
  if (digits === "0000000000") return false;
  const check = Number(digits[9]);
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * (10 - i);
  }
  const rem = sum % 11;
  return rem < 2 ? check === rem : check === 11 - rem;
}

export function toastSuccess(title, text) {
  if (text) {
    return toast.success(title, { description: text });
  }
  return toast.success(title);
}

export function toastError(title, text) {
  if (text) {
    return toast.error(title, { description: text });
  }
  return toast.error(title);
}
