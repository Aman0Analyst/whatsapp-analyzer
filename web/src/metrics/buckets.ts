import type { DurationStat, TimeGrain } from "../types/chat";

export const MIN_DURATION_SAMPLE = 5;

export function bucketStart(date: Date, grain: TimeGrain): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  if (grain === "day") return new Date(year, month, day);
  if (grain === "week") {
    const mondayOffset = (date.getDay() + 6) % 7;
    return new Date(year, month, day - mondayOffset);
  }
  if (grain === "month") return new Date(year, month, 1);
  const quarterMonth = Math.floor(month / 3) * 3;
  return new Date(year, quarterMonth, 1);
}

export function addGrain(date: Date, grain: TimeGrain): Date {
  const next = new Date(date.getTime());
  if (grain === "day") next.setDate(next.getDate() + 1);
  else if (grain === "week") next.setDate(next.getDate() + 7);
  else if (grain === "month") next.setMonth(next.getMonth() + 1);
  else next.setMonth(next.getMonth() + 3);
  return next;
}

export function enumerateBuckets(start: Date, end: Date, grain: TimeGrain): Date[] {
  const buckets: Date[] = [];
  let cursor = bucketStart(start, grain);
  const last = bucketStart(end, grain);
  while (cursor.getTime() <= last.getTime()) {
    buckets.push(new Date(cursor.getTime()));
    cursor = addGrain(cursor, grain);
  }
  return buckets;
}

function sorted(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

export function median(values: number[]): number {
  const xs = sorted(values);
  const mid = Math.floor(xs.length / 2);
  if (xs.length % 2 === 0) return (xs[mid - 1] + xs[mid]) / 2;
  return xs[mid];
}

export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function p90(values: number[]): number {
  const xs = sorted(values);
  if (xs.length === 1) return xs[0];
  const idx = (xs.length - 1) * 0.9;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return xs[lo];
  return xs[lo] + (idx - lo) * (xs[hi] - xs[lo]);
}

export function reduceDuration(values: number[], stat: DurationStat): number | null {
  if (values.length < MIN_DURATION_SAMPLE) return null;
  if (stat === "median") return median(values);
  if (stat === "mean") return mean(values);
  return p90(values);
}
