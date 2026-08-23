/**
 * Convert Persian/Farsi digits to English digits
 * @param phone Phone number string that may contain Persian digits
 * @returns Phone number with English digits only
 */
export function convertPersianToEnglishDigits(phone: string): string {
  if (!phone) return phone;
  
  // Map Persian digits to English digits
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const englishDigits = '0123456789';
  
  return phone.replace(/[۰-۹]/g, (char) => {
    const index = persianDigits.indexOf(char);
    return index !== -1 ? englishDigits[index] : char;
  });
}

/**
 * Normalize phone number: remove spaces, dashes, and convert Persian to English digits
 * @param phone Raw phone number input
 * @returns Normalized phone number (English digits only, no spaces/dashes)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone;
  
  // Convert Persian to English digits
  let normalized = convertPersianToEnglishDigits(phone);
  
  // Remove spaces, dashes, parentheses, and other non-digit characters (except + at start)
  normalized = normalized.replace(/[\s\-\(\)\.]/g, '');
  
  // Remove leading + if present (we'll keep it if needed)
  // For Iranian numbers, we typically don't need +
  if (normalized.startsWith('+98')) {
    normalized = '0' + normalized.substring(3);
  } else if (normalized.startsWith('0098')) {
    normalized = '0' + normalized.substring(4);
  }
  
  return normalized;
}
