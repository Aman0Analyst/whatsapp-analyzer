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

/**
 * The same statistics named as the subject of a sentence. Kept apart from
 * STAT_LABEL because "Slow replies" is already plural and will not take a verb.
 */
const STAT_SUBJECT: Record<DurationStat, string> = {
  median: "Typical reply",
  p90: "Slow replies",
  mean: "Average reply",
};

/**
 * One sentence comparing the later half of the visible stretch with the
 * earlier half. Returns null when neither half has enough replies to name.
 */
export function periodComparisonSentence(
  comparison: { current: number | null; previous: number | null; deltaSeconds: number | null },
  stat: DurationStat,
): string | null {
  const subject = STAT_SUBJECT[stat];
  const { current, previous, deltaSeconds } = comparison;
  if (current !== null && previous !== null) {
    const now = formatDuration(current);
    const before = formatDuration(previous);
    const change =
      now === before
        ? "about the same"
        : `${formatDuration(Math.abs(deltaSeconds ?? 0))} ${current > previous ? "slower" : "faster"}`;
    return `${subject}: ${now} more recently, ${before} earlier on — ${change}.`;
  }
  if (current !== null) {
    return `${subject}: ${formatDuration(current)} more recently. Too few replies earlier on to compare.`;
  }
  if (previous !== null) {
    return `${subject}: ${formatDuration(previous)} earlier on. Too few replies since to compare.`;
  }
  return null;
}
