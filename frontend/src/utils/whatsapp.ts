/**
 * WhatsApp Direct Ordering & Support Helper
 */

export function buildWhatsAppUrl(phoneNumber: string | null | undefined, message: string): string {
  const fallback = '+212600000000';
  const rawNumber = phoneNumber || fallback;

  // Normalize phone number to digits only for wa.me URL
  let clean = rawNumber.replace(/[^0-9]/g, '');

  // If number starts with 0 (e.g. 0612345678), replace leading 0 with 212
  if (clean.startsWith('0') && clean.length === 10) {
    clean = `212${clean.slice(1)}`;
  }

  // If missing country prefix and starts with 6, 7 or 5 with 9 digits
  if ((clean.startsWith('6') || clean.startsWith('7') || clean.startsWith('5')) && clean.length === 9) {
    clean = `212${clean}`;
  }

  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
