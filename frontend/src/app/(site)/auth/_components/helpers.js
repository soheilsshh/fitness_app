import { toast } from "sonner";

/** Convert Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII 0-9. */
export function toEnglishDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
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
