/**
 * Shared biomarker helpers.
 *
 * Status classification used to be implemented three times — in HomeScreen
 * (twice, inconsistently) and PatientDetailScreen — and the versions
 * disagreed about whether `NORMAL` counts as optimal. That meant the same
 * result could render green on one screen and amber on another. This is now
 * the single definition.
 */

export type BiomarkerStatus = 'optimal' | 'watch' | 'risk' | 'unknown';

export type BiomarkerRow = {
  id?: number | string;
  name: string;
  value: number;
  unit: string;
  range?: string;
  category?: string;
  status: string;
};

/** Map the server's free-form status string onto our three semantic states. */
export const classifyStatus = (raw?: string | null): BiomarkerStatus => {
  const s = String(raw ?? '').trim().toUpperCase();
  if (!s) return 'unknown';
  if (s === 'OPTIMAL' || s === 'NORMAL' || s === 'IN RANGE' || s === 'GOOD') return 'optimal';
  if (s === 'LOW' || s === 'HIGH' || s === 'CRITICAL' || s === 'OUT OF RANGE') return 'risk';
  return 'watch';
};

export const statusLabel = (raw?: string | null): string => {
  const s = String(raw ?? '').trim();
  if (!s) return 'Unknown';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

/** CSS modifier for `.chip`, so colour always follows classification. */
export const statusChipClass = (raw?: string | null): string => {
  const kind = classifyStatus(raw);
  if (kind === 'optimal') return 'chip chip--optimal';
  if (kind === 'risk') return 'chip chip--risk';
  if (kind === 'watch') return 'chip chip--watch';
  return 'chip';
};

/** Large numbers from mass-spec data need grouping; small ones need precision. */
export const formatBiomarkerValue = (value: number): string => {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (Number.isInteger(value)) return String(value);
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export type BiomarkerSummary = {
  total: number;
  optimal: number;
  toWatch: number;
  healthScore: number;
};

export const summarise = (rows: { status: string }[]): BiomarkerSummary => {
  const total = rows.length;
  const optimal = rows.filter((r) => classifyStatus(r.status) === 'optimal').length;
  return {
    total,
    optimal,
    toWatch: total - optimal,
    healthScore: total > 0 ? Math.round((optimal / total) * 100) : 0,
  };
};

/** Group rows by category for the sectioned view. */
export const groupByCategory = <T extends { category?: string }>(rows: T[]): { section: string; items: T[] }[] => {
  const grouped = new Map<string, T[]>();
  rows.forEach((row) => {
    const key = row.category || 'General';
    const bucket = grouped.get(key);
    if (bucket) bucket.push(row);
    else grouped.set(key, [row]);
  });
  return Array.from(grouped, ([section, items]) => ({ section, items }));
};
