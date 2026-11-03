/**
 * Editorial Luxury Formatters
 */

/**
 * Formats a monetary number into Moroccan Dirham (MAD)
 * Example: 180 -> "180.00 MAD"
 */
export function formatMAD(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0);
  if (isNaN(num)) return '0.00 MAD';
  return `${num.toFixed(2)} MAD`;
}

/**
 * Formats an ISO date into French editorial style
 * Example: "2026-11-03T14:30:00Z" -> "3 novembre 2026"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Formats an ISO date into short date & time
 * Example: "3 nov. 2026, 14:30"
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Formats a phone number for elegant human reading
 * Example: "+212612345678" -> "+212 6 12 34 56 78"
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '—';
  const clean = phone.replace(/\s+/g, '');
  if (clean.startsWith('+212') && clean.length === 13) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)} ${clean.slice(11, 13)}`;
  }
  return phone;
}

