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

/**
 * Translates backend OrderStatus enum into official French editorial display
 */
export function formatOrderStatus(status: string | null | undefined): string {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'confirmed':
      return 'Confirmée';
    case 'processing':
      return 'En préparation';
    case 'shipped':
      return 'Expédiée';
    case 'delivered':
      return 'Livrée';
    case 'cancelled':
      return 'Annulée';
    default:
      return status || '—';
  }
}

/**
 * Translates backend OrderSource enum into official French editorial display
 */
export function formatOrderSource(source: string | null | undefined): string {
  switch (source) {
    case 'website':
      return 'Site web';
    case 'whatsapp':
      return 'WhatsApp';
    default:
      return source || '—';
  }
}

/**
 * Translates user roles into official French titles
 */
export function formatUserRole(role: string | null | undefined): string {
  switch (role) {
    case 'admin':
      return 'Administrateur';
    case 'staff':
      return 'Équipe';
    default:
      return role || 'Opérateur';
  }
}

/**
 * Translates backend PaymentStatus enum into official French editorial display
 */
export function formatPaymentStatus(status: string | null | undefined): string {
  switch (status) {
    case 'paid':
      return 'Payé (COD)';
    case 'unpaid':
      return 'À encaisser (COD)';
    case 'refunded':
      return 'Remboursé';
    case 'failed':
      return 'Échoué';
    case 'pending':
      return 'En attente';
    default:
      return status || '—';
  }
}



