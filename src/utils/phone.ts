/**
 * Moroccan Phone Number Normalization Utility
 *
 * Normalizes customer phone numbers to canonical E.164 Moroccan international format (+212XXXXXXXXX)
 * or general international format (+[country][number]).
 */

export const normalizePhone = (rawPhone: string): string => {
  if (!rawPhone) return '';

  // Remove whitespace, hyphens, parentheses, and dots
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '');

  // Convert leading 00 to +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Handle standard Moroccan local format (e.g., 0612345678, 0712345678, 0512345678)
  if (/^0[567]\d{8}$/.test(cleaned)) {
    return '+212' + cleaned.slice(1);
  }

  // Handle Moroccan format missing the plus sign (e.g. 212612345678)
  if (/^212[567]\d{8}$/.test(cleaned)) {
    return '+' + cleaned;
  }

  // If already in international format (+212...), return cleaned
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Default: return cleaned with + if digits only
  return /^\d+$/.test(cleaned) ? `+${cleaned}` : cleaned;
};

export const isValidPhone = (phone: string): boolean => {
  const normalized = normalizePhone(phone);
  // Validates Moroccan mobile/landline (+212 followed by 9 digits) or generic international (8-15 digits)
  return /^\+212[567]\d{8}$/.test(normalized) || /^\+[1-9]\d{7,14}$/.test(normalized);
};
