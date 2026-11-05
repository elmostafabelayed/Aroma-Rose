export const MOROCCO_TIMEZONE = 'Africa/Casablanca';

/**
 * Formats a given Date into Moroccan calendar date (YYYY-MM-DD) in Africa/Casablanca
 */
export function getMoroccoDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MOROCCO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Adds an integer number of days to a YYYY-MM-DD string, returning a new YYYY-MM-DD string
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Converts a Moroccan calendar date 'YYYY-MM-DD' and optional 'HH:mm:ss' to a UTC Date object.
 * Correctly accounts for Moroccan standard/daylight time (GMT+0 during Ramadan and GMT+1 otherwise).
 */
export function moroccoToUtcDate(dateStr: string, timeStr = '00:00:00'): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min, sec] = timeStr.split(':').map(Number);
  const guessUtc = new Date(Date.UTC(year, month - 1, day, hour, min, sec));

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MOROCCO_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(guessUtc);
  const p: Record<string, number> = {};
  for (const part of parts) {
    p[part.type] = Number(part.value);
  }
  const casablancaHour = p.hour === 24 ? 0 : p.hour;
  const casablancaTimeAsUtc = Date.UTC(p.year, p.month - 1, p.day, casablancaHour, p.minute, p.second);
  const offsetMs = casablancaTimeAsUtc - guessUtc.getTime();

  return new Date(guessUtc.getTime() - offsetMs);
}
