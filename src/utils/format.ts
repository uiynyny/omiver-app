/**
 * Shared formatting helpers.
 *
 * Age was computed in four places and dates formatted in five, including two
 * byte-identical `formatOrderDate` functions. These are the canonical versions.
 */

/** e.g. "12 Sep 2026". Returns an em dash for missing or unparseable input. */
export const formatDate = (input?: string | number | Date | null): string => {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/** e.g. "12 September 2026" for headings where the long form reads better. */
export const formatDateLong = (input?: string | number | Date | null): string => {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatDateTime = (input?: string | number | Date | null): string => {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

/** Whole years since the given date of birth. */
export const calcAge = (dateOfBirth?: string | null): number | undefined => {
  if (!dateOfBirth) return undefined;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return undefined;

  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : undefined;
};

/** Inches → `5 ft 8 in`. */
export const formatHeight = (inches?: number | string | null): string => {
  const total = Number(inches);
  if (!total || !Number.isFinite(total)) return '—';
  return `${Math.floor(total / 12)} ft ${Math.round(total % 12)} in`;
};

export const formatWeight = (pounds?: number | string | null): string => {
  const value = Number(pounds);
  if (!value || !Number.isFinite(value)) return '—';
  return `${value} lbs`;
};

export const formatUSD = (value: number | string): string => {
  const amount = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};
