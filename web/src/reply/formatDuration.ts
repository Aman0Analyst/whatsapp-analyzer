import type { DurationStat } from "../types/chat";

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = seconds / 3600;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

export function windowLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${minutes / 60} h`;
}

/**
 * Plain-language names for the duration statistics. "P90" means nothing to
 * most readers, so the percentile is described by what it tells you instead.
 */
export const STAT_LABEL: Record<DurationStat, string> = {
  median: "Typical",
  p90: "Slow replies",
  mean: "Average",
};

/** Lower-case form for use inside a sentence. */
export function statLabel(stat: DurationStat): string {
  return STAT_LABEL[stat].toLowerCase();
}
