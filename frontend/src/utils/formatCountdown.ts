const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Convert ASCII digits to Persian digits. */
export function toFaDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]!);
}

/**
 * Format remaining ms as m:ss (Persian digits).
 * Ceils so the last second still shows until it fully elapses.
 */
export function formatEnergyCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${toFaDigits(minutes)}:${toFaDigits(seconds.toString().padStart(2, '0'))}`;
}
